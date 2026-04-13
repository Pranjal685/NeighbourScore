const axios = require('axios');

// Fallback locality scores for Pune areas (based on hospital density data)
const HEALTHCARE_LOCALITY_SCORES = {
  'koregaon park': 98, 'baner': 78, 'aundh': 85, 'kothrud': 80,
  'wakad': 65, 'hinjewadi': 58, 'viman nagar': 82, 'hadapsar': 68,
  'kharadi': 77, 'pimple saudagar': 65, 'magarpatta': 72,
  'kalyani nagar': 88, 'dhanori': 45, 'chinchwad': 60, 'nibm': 55,
  'kondhwa': 52, 'katraj': 50, 'wagholi': 42, 'warje': 58,
  // Generic entries last — prevents ", Pune" suffix from matching prematurely
  'pimpri': 62, 'pune': 70,
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
 * Uses a fallback-anchored formula so that a dense result count in a
 * developing area doesn't inflate its score beyond the calibrated baseline.
 * TARGET = 6 hospitals within 3km → full locality-calibrated score.
 */
async function getHealthcareScore(lat, lng, localityName) {
  const fallbackResult = getFallbackScore(lat, lng, localityName);

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return fallbackResult;

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

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return fallbackResult;
    }

    const results = data.results || [];
    const count = results.length;
    const TARGET = 6;

    // Ramp from 50% to 100% of locality-calibrated score as count approaches TARGET.
    // Above TARGET, cap at the calibrated score — extra density doesn't inflate.
    const ratio = count >= TARGET ? 1 : 0.5 + 0.5 * (count / TARGET);
    const score = Math.min(100, Math.max(0, Math.round(fallbackResult.score * ratio)));

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
    return fallbackResult;
  }
}

module.exports = { getHealthcareScore };
