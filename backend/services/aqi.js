const axios = require('axios');

// Fallback AQI scores by locality when CPCB API key is missing
const AQI_LOCALITY_SCORES = {
  'koregaon park': 85, 'baner': 88, 'aundh': 82, 'kothrud': 78,
  'wakad': 72, 'hinjewadi': 75, 'viman nagar': 80, 'hadapsar': 62,
  'kharadi': 68, 'dhanori': 58, 'pimpri': 65, 'chinchwad': 62,
  'magarpatta': 70, 'kalyani nagar': 80, 'pimple saudagar': 72,
  'nibm': 68, 'kondhwa': 65, 'katraj': 62, 'warje': 70,
  'pune': 72,
};

/**
 * Haversine distance in km between two lat/lng points.
 */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Map AQI value to a 0-100 score (higher is better).
 */
function aqiToScore(aqi) {
  if (aqi <= 50) return 100;
  if (aqi <= 100) return 80;
  if (aqi <= 150) return 60;
  if (aqi <= 200) return 40;
  return 20;
}

/**
 * Fetch nearest CPCB air quality station and return score.
 */
async function getAqiScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.CPCB_API_KEY;
    if (!apiKey) {
      // Use locality-specific fallback instead of flat 60
      const search = (localityName || '').toLowerCase();
      for (const [key, score] of Object.entries(AQI_LOCALITY_SCORES)) {
        if (search.includes(key)) {
          return { score, raw: { error: true, note: 'CPCB_API_KEY not set', locality_matched: key } };
        }
      }
      return { score: 60, raw: { error: true, note: 'CPCB_API_KEY not set' } };
    }

    const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`;

    // First attempt: filter by state=Maharashtra at the API level so we only get
    // relevant stations without wasting the 100-record limit on unrelated states.
    let { data } = await axios.get(url, {
      params: {
        'api-key': apiKey,
        format: 'json',
        limit: 100,
        'filters[state]': 'Maharashtra',
      },
      timeout: 10000,
    });

    let records = data.records || [];

    // If the API-level filter returned nothing (unsupported or no results), fall back
    // to fetching all India stations with a high limit so Pune stations are included.
    if (records.length === 0) {
      console.log('[AQI] Maharashtra filter returned 0 records — fetching all India (limit 500)');
      const fallbackRes = await axios.get(url, {
        params: { 'api-key': apiKey, format: 'json', limit: 500 },
        timeout: 15000,
      });
      records = fallbackRes.data.records || [];
    }

    if (records.length === 0) {
      return { score: 60, raw: { error: true, note: 'No CPCB stations returned' } };
    }

    // Log first record to reveal actual field names from CPCB API
    console.log('[AQI] Raw response sample:', JSON.stringify(records[0]));
    console.log('[AQI] Total records returned:', records.length);

    /**
     * Extract coordinates from a record, handling common CPCB field name variants.
     * Returns { sLat, sLng } — both NaN if coordinates cannot be parsed.
     */
    function extractCoords(rec) {
      const sLat = parseFloat(rec.latitude ?? rec.lat ?? rec.station_latitude ?? NaN);
      const sLng = parseFloat(rec.longitude ?? rec.long ?? rec.lng ?? rec.station_longitude ?? NaN);
      return { sLat, sLng };
    }

    /**
     * Find nearest station from a candidate list.
     * Returns { nearest, minDist } or { nearest: null, minDist: Infinity }.
     */
    function findNearest(candidates) {
      let nearest = null;
      let minDist = Infinity;
      for (const rec of candidates) {
        const { sLat, sLng } = extractCoords(rec);
        if (isNaN(sLat) || isNaN(sLng)) continue;
        const dist = haversine(lat, lng, sLat, sLng);
        if (dist < minDist) {
          minDist = dist;
          nearest = rec;
        }
      }
      return { nearest, minDist };
    }

    // Log distances for first 5 stations to help debug coordinate issues
    records.slice(0, 5).forEach((rec, i) => {
      const { sLat, sLng } = extractCoords(rec);
      const dist = (!isNaN(sLat) && !isNaN(sLng)) ? haversine(lat, lng, sLat, sLng).toFixed(1) : 'NaN';
      console.log(`[AQI] Station[${i}]: ${rec.station || rec.city || 'unknown'} | lat=${sLat} lng=${sLng} | dist=${dist}km`);
    });

    // Step 1: prefer stations in Pune city or Maharashtra state
    const puneRecords = records.filter((rec) => {
      const city = (rec.city || rec.station_city || '').toLowerCase();
      const state = (rec.state || rec.station_state || '').toLowerCase();
      return city.includes('pune') || state.includes('maharashtra');
    });

    console.log(`[AQI] Pune/Maharashtra stations found: ${puneRecords.length}`);

    let { nearest, minDist } = puneRecords.length > 0
      ? findNearest(puneRecords)
      : findNearest(records); // fallback: all-India haversine

    if (!nearest) {
      return { score: 60, raw: { error: true, note: 'No valid station coordinates' } };
    }

    console.log(`[AQI] Nearest station: ${nearest.station || nearest.city || 'unknown'} at ${Math.round(minDist)}km`);

    const aqiRaw = parseFloat(nearest.pollutant_avg);
    const aqi = isNaN(aqiRaw) ? null : aqiRaw;

    // Station returned AQI 0 or null — sensor has no current reading.
    // Fall back to locality-based estimate instead of scoring 100.
    if (!aqi || aqi === 0) {
      console.log(`[AQI] Station "${nearest.station || nearest.city}" returned AQI=${aqiRaw} — treating as missing, using locality fallback`);
      const search = (localityName || '').toLowerCase();
      for (const [key, fallbackScore] of Object.entries(AQI_LOCALITY_SCORES)) {
        if (search.includes(key)) {
          return {
            score: fallbackScore,
            raw: {
              aqi: 0,
              station_name: nearest.station || nearest.city || 'Unknown',
              distance_km: Math.round(minDist * 10) / 10,
              fallback: true,
              note: 'Station reading unavailable, using locality estimate',
              locality_matched: key,
            },
          };
        }
      }
      return {
        score: 60,
        raw: {
          aqi: 0,
          station_name: nearest.station || nearest.city || 'Unknown',
          distance_km: Math.round(minDist * 10) / 10,
          fallback: true,
          note: 'Station reading unavailable, using default estimate',
        },
      };
    }

    const score = Math.min(100, Math.max(0, aqiToScore(aqi)));

    return {
      score,
      raw: {
        aqi: Math.round(aqi),
        station_name: nearest.station || nearest.city || 'Unknown',
        distance_km: Math.round(minDist * 10) / 10,
      },
    };
  } catch (err) {
    return { score: 60, raw: { error: true, message: err.message } };
  }
}

module.exports = { getAqiScore };
