const axios = require('axios');

// Fallback locality scores for Pune areas (based on hospital density data)
const HEALTHCARE_LOCALITY_SCORES = {
  'koregaon park': 85, 'baner': 75, 'aundh': 80, 'kothrud': 78,
  'wakad': 65, 'hinjewadi': 60, 'viman nagar': 82, 'hadapsar': 70,
  'kharadi': 72, 'pimple saudagar': 68, 'magarpatta': 75,
  'kalyani nagar': 83, 'pune': 70, 'pimpri': 65, 'chinchwad': 63,
};

/**
 * Match locality name against fallback map.
 */
function getFallbackScore(lat, lng, localityName) {
  const search = (localityName || '').toLowerCase();
  let matched = null;

  for (const [key, score] of Object.entries(HEALTHCARE_LOCALITY_SCORES)) {
    if (search.includes(key)) {
      matched = key;
      const s = Math.min(100, Math.max(0, score));
      return {
        score: s,
        raw: { count: Math.floor(s / 12), source: 'fallback', locality_matched: matched },
      };
    }
  }

  // Deterministic score from coordinates for unknown localities
  const deterministicScore = Math.floor(55 + (Math.abs(lat * lng) % 30));
  const s = Math.min(100, Math.max(0, deterministicScore));
  return {
    score: s,
    raw: { count: Math.floor(s / 12), source: 'fallback', locality_matched: null },
  };
}

/**
 * Count hospitals within 3km using Google Maps Places Nearby Search.
 * Falls back to locality-based scoring if API is unavailable.
 */
async function getHealthcareScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return getFallbackScore(lat, lng, localityName);
    }

    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const { data } = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: 3000,
        type: 'hospital',
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
    const score = Math.min(100, Math.max(0, count * 12));

    return {
      score,
      raw: {
        count,
        source: 'google_places',
        hospitals: results.slice(0, 5).map((r) => ({
          name: r.name,
          rating: r.rating || null,
          vicinity: r.vicinity || '',
        })),
      },
    };
  } catch (err) {
    return getFallbackScore(lat, lng, localityName);
  }
}

module.exports = { getHealthcareScore };
