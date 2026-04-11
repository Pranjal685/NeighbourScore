const axios = require('axios');

// Fallback locality scores for Pune areas (based on transit connectivity)
const TRANSPORT_LOCALITY_SCORES = {
  'koregaon park': 88, 'baner': 68, 'aundh': 78, 'kothrud': 75,
  'wakad': 52, 'hinjewadi': 42, 'viman nagar': 72, 'hadapsar': 65,
  'kharadi': 60, 'pimple saudagar': 58, 'magarpatta': 68,
  'kalyani nagar': 82, 'dhanori': 38, 'pune': 72, 'pimpri': 68,
  'chinchwad': 65, 'nibm': 48, 'kondhwa': 45, 'katraj': 42, 'warje': 55,
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
 * Count bus stations within 500m using Google Maps Places Nearby Search.
 * Falls back to locality-based scoring if API is unavailable.
 */
async function getTransportScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return getFallbackScore(lat, lng, localityName);
    }

    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const { data } = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: 500,
        type: 'bus_station',
        key: apiKey,
      },
      timeout: 10000,
    });

    // If API returns non-OK or ZERO_RESULTS, use locality fallback
    // ZERO_RESULTS for bus_station is unreliable — Places API often misses PMPML stops
    if (data.status !== 'OK') {
      return getFallbackScore(lat, lng, localityName);
    }

    const results = data.results || [];
    const count = results.length;
    // If API returns suspiciously low count (≤1), blend with fallback
    if (count <= 1) {
      return getFallbackScore(lat, lng, localityName);
    }
    const score = Math.min(100, Math.max(0, count * 15));

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
    return getFallbackScore(lat, lng, localityName);
  }
}

module.exports = { getTransportScore };
