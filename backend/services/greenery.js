const axios = require('axios');

// Fallback locality scores for Pune areas (based on green cover data)
const GREENERY_LOCALITY_SCORES = {
  'koregaon park': 95, 'baner': 82, 'aundh': 80, 'kothrud': 72,
  'wakad': 58, 'hinjewadi': 52, 'viman nagar': 68, 'hadapsar': 55,
  'kharadi': 60, 'pimple saudagar': 62, 'magarpatta': 78,
  'kalyani nagar': 80, 'dhanori': 40, 'pune': 62, 'pimpri': 52,
  'chinchwad': 50, 'nibm': 55, 'kondhwa': 50, 'katraj': 45, 'warje': 58,
};

/**
 * Match locality name against fallback map.
 */
function getFallbackScore(lat, lng, localityName) {
  const search = (localityName || '').toLowerCase();
  let matched = null;

  for (const [key, score] of Object.entries(GREENERY_LOCALITY_SCORES)) {
    if (search.includes(key)) {
      matched = key;
      const s = Math.min(100, Math.max(0, score));
      return {
        score: s,
        raw: { count: Math.floor(s / 20), source: 'fallback', locality_matched: matched },
      };
    }
  }

  // Deterministic score from coordinates for unknown localities
  const deterministicScore = Math.floor(55 + (Math.abs(lat * lng) % 30));
  const s = Math.min(100, Math.max(0, deterministicScore));
  return {
    score: s,
    raw: { count: Math.floor(s / 20), source: 'fallback', locality_matched: null },
  };
}

/**
 * Count parks within 1km using Google Maps Places Nearby Search.
 * Falls back to locality-based scoring if API is unavailable.
 */
async function getGreeneryScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return getFallbackScore(lat, lng, localityName);
    }

    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const { data } = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: 1000,
        type: 'park',
        key: apiKey,
      },
      timeout: 10000,
    });

    // If API returns non-OK status (billing issue, quota, etc.), use fallback
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return getFallbackScore(lat, lng, localityName);
    }

    const results = data.results || [];
    const count = results.length;
    const score = Math.min(100, Math.max(0, count * 20));

    return {
      score,
      raw: {
        count,
        source: 'google_places',
        parks: results.slice(0, 5).map((r) => ({
          name: r.name,
          vicinity: r.vicinity || '',
        })),
      },
    };
  } catch (err) {
    return getFallbackScore(lat, lng, localityName);
  }
}

module.exports = { getGreeneryScore };
