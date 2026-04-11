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
    const { data } = await axios.get(url, {
      params: {
        'api-key': apiKey,
        format: 'json',
        limit: 100,
      },
      timeout: 10000,
    });

    const records = data.records || [];
    if (records.length === 0) {
      return { score: 60, raw: { error: true, note: 'No CPCB stations returned' } };
    }

    // Find nearest station
    let nearest = null;
    let minDist = Infinity;

    for (const rec of records) {
      const sLat = parseFloat(rec.latitude);
      const sLng = parseFloat(rec.longitude);
      if (isNaN(sLat) || isNaN(sLng)) continue;

      const dist = haversine(lat, lng, sLat, sLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = rec;
      }
    }

    if (!nearest) {
      return { score: 60, raw: { error: true, note: 'No valid station coordinates' } };
    }

    const aqi = parseFloat(nearest.pollutant_avg) || 0;
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
