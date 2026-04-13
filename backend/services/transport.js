const axios = require('axios');

// Fallback locality scores for Pune areas (based on transit connectivity)
const TRANSPORT_LOCALITY_SCORES = {
  'koregaon park': 88, 'baner': 68, 'aundh': 78, 'kothrud': 75,
  'wakad': 52, 'hinjewadi': 35, 'viman nagar': 72, 'hadapsar': 65,
  'kharadi': 60, 'pimple saudagar': 58, 'magarpatta': 68,
  'kalyani nagar': 82, 'dhanori': 38, 'chinchwad': 65, 'nibm': 48,
  'kondhwa': 45, 'katraj': 42, 'wagholi': 35, 'warje': 55,
  // Generic entries last — prevents ", Pune" suffix from matching prematurely
  'pimpri': 68, 'pune': 72,
};

/**
 * Match locality name against fallback map.
 */
function getFallbackScore(lat, lng, localityName) {
  const search = (localityName || '').toLowerCase();
  let matched = null;

  for (const [key, score] of Object.entries(TRANSPORT_LOCALITY_SCORES)) {
    if (search.includes(key)) {
      matched = key;
      const s = Math.min(100, Math.max(0, score));
      return {
        score: s,
        raw: { count: Math.floor(s / 15), source: 'fallback', locality_matched: matched },
      };
    }
  }

  // Deterministic score from coordinates for unknown localities
  const deterministicScore = Math.floor(55 + (Math.abs(lat * lng) % 30));
  const s = Math.min(100, Math.max(0, deterministicScore));
  return {
    score: s,
    raw: { count: Math.floor(s / 15), source: 'fallback', locality_matched: null },
  };
}

/**
 * Attempt a Places Nearby Search and return results array, or null on failure.
 * Logs the URL, status, and result count for debugging.
 */
async function tryNearbySearch(lat, lng, apiKey, params, label) {
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const fullParams = { location: `${lat},${lng}`, radius: 1000, key: apiKey, ...params };
  console.log(`[Transport] ${label} URL: ${url} params: ${JSON.stringify({ ...fullParams, key: '***' })}`);
  const { data } = await axios.get(url, { params: fullParams, timeout: 10000 });
  console.log(`[Transport] ${label} status=${data.status} count=${(data.results || []).length}`);
  if (data.status === 'OK' && (data.results || []).length > 0) {
    return data.results;
  }
  return null;
}

/**
 * Attempt a Places Text Search and return results array, or null on failure.
 */
async function tryTextSearch(lat, lng, apiKey, query, label) {
  const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const params = { query: `${query} near ${lat},${lng}`, key: apiKey };
  console.log(`[Transport] ${label} URL: ${url} params: ${JSON.stringify({ ...params, key: '***' })}`);
  const { data } = await axios.get(url, { params, timeout: 10000 });
  console.log(`[Transport] ${label} status=${data.status} count=${(data.results || []).length}`);
  if (data.status === 'OK' && (data.results || []).length > 0) {
    return data.results;
  }
  return null;
}

/**
 * Count bus/transit stops within 1km using Google Maps Places API.
 * Cascades through three strategies before falling back to locality scoring:
 *   1. Nearby Search — type=transit_station
 *   2. Nearby Search — keyword="bus stop PMPML"
 *   3. Text Search   — query="PMPML bus stop near <lat,lng>"
 */
async function getTransportScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return getFallbackScore(lat, lng, localityName);
    }

    let results = null;

    // Strategy 1: transit_station (catches metro, BRT, and bus terminals)
    results = await tryNearbySearch(lat, lng, apiKey, { type: 'transit_station' }, 'S1:transit_station');

    // Strategy 2: keyword search for PMPML bus stops
    if (!results) {
      results = await tryNearbySearch(lat, lng, apiKey, { keyword: 'bus stop PMPML' }, 'S2:keyword=bus_stop_PMPML');
    }

    // Strategy 3: text search as last resort
    if (!results) {
      results = await tryTextSearch(lat, lng, apiKey, 'PMPML bus stop', 'S3:textsearch');
    }

    if (!results) {
      console.log('[Transport] All 3 strategies returned no results — using fallback');
      return getFallbackScore(lat, lng, localityName);
    }

    const count = results.length;
    const fallbackResult = getFallbackScore(lat, lng, localityName);
    const TARGET = 7; // 7 stops within 1km = full locality-calibrated score

    // Ramp from 50% to 100% of locality-calibrated score as count approaches TARGET.
    // Above TARGET, cap at calibrated score — extra stop density doesn't inflate.
    const ratio = count >= TARGET ? 1 : 0.5 + 0.5 * (count / TARGET);
    const score = Math.min(100, Math.max(0, Math.round(fallbackResult.score * ratio)));

    return {
      score,
      raw: {
        count,
        source: 'google_places',
        stops: results.slice(0, 5).map((r) => ({
          name: r.name,
          vicinity: r.vicinity || '',
        })),
      },
    };
  } catch (err) {
    console.error('[Transport] Error:', err.message);
    return getFallbackScore(lat, lng, localityName);
  }
}

module.exports = { getTransportScore };
