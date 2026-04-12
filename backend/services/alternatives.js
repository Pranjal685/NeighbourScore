/**
 * Pune neighborhood relationship map with approximate base scores
 * and nearby areas. Used to surface "Better Alternatives Nearby".
 */
const PUNE_AREAS = {
  wakad: {
    name: 'Wakad',
    lat: 18.5974, lng: 73.7898,
    base_score: 65,
    nearby: ['baner', 'hinjewadi', 'pimple_saudagar', 'aundh'],
  },
  baner: {
    name: 'Baner',
    lat: 18.5590, lng: 73.7868,
    base_score: 78,
    nearby: ['aundh', 'wakad', 'pashan', 'sus_road'],
  },
  koregaon_park: {
    name: 'Koregaon Park',
    lat: 18.5362, lng: 73.8937,
    base_score: 82,
    nearby: ['kalyani_nagar', 'viman_nagar', 'kharadi', 'mundhwa'],
  },
  kothrud: {
    name: 'Kothrud',
    lat: 18.5074, lng: 73.8077,
    base_score: 76,
    nearby: ['warje', 'karve_nagar', 'bavdhan', 'pashan'],
  },
  hinjewadi: {
    name: 'Hinjewadi',
    lat: 18.5912, lng: 73.7389,
    base_score: 58,
    nearby: ['wakad', 'mahalunge', 'mann', 'pimple_saudagar'],
  },
  viman_nagar: {
    name: 'Viman Nagar',
    lat: 18.5679, lng: 73.9143,
    base_score: 79,
    nearby: ['kharadi', 'kalyani_nagar', 'nagar_road', 'wadgaon_sheri'],
  },
  hadapsar: {
    name: 'Hadapsar',
    lat: 18.5018, lng: 73.9260,
    base_score: 64,
    nearby: ['magarpatta', 'mundhwa', 'fursungi', 'undri'],
  },
  kharadi: {
    name: 'Kharadi',
    lat: 18.5524, lng: 73.9456,
    base_score: 70,
    nearby: ['viman_nagar', 'wagholi', 'koregaon_park', 'hadapsar'],
  },
  aundh: {
    name: 'Aundh',
    lat: 18.5589, lng: 73.8078,
    base_score: 80,
    nearby: ['baner', 'sus_road', 'pimple_gurav', 'wakad'],
  },
  magarpatta: {
    name: 'Magarpatta',
    lat: 18.5099, lng: 73.9283,
    base_score: 73,
    nearby: ['hadapsar', 'kharadi', 'mundhwa', 'koregaon_park'],
  },
  kalyani_nagar: {
    name: 'Kalyani Nagar',
    lat: 18.5531, lng: 73.9006,
    base_score: 84,
    nearby: ['koregaon_park', 'viman_nagar', 'kharadi', 'wadgaon_sheri'],
  },
  pimple_saudagar: {
    name: 'Pimple Saudagar',
    lat: 18.6072, lng: 73.7798,
    base_score: 63,
    nearby: ['wakad', 'baner', 'hinjewadi', 'pimple_gurav'],
  },
};

/**
 * Approximate distances in km between key area pairs.
 * Keys are always stored as "smaller-larger" alphabetically.
 */
const DISTANCES = {
  'aundh-baner': 3,
  'aundh-pimple_gurav': 4,
  'aundh-sus_road': 5,
  'aundh-wakad': 7,
  'baner-koregaon_park': 8,
  'baner-pashan': 4,
  'baner-sus_road': 5,
  'baner-wakad': 4,
  'hadapsar-kharadi': 8,
  'hadapsar-magarpatta': 2,
  'hadapsar-mundhwa': 3,
  'hadapsar-undri': 5,
  'hinjewadi-mahalunge': 4,
  'hinjewadi-mann': 6,
  'hinjewadi-pimple_saudagar': 4,
  'hinjewadi-wakad': 5,
  'kalyani_nagar-koregaon_park': 3,
  'kalyani_nagar-kharadi': 5,
  'kalyani_nagar-viman_nagar': 5,
  'kalyani_nagar-wadgaon_sheri': 4,
  'kharadi-koregaon_park': 6,
  'kharadi-viman_nagar': 4,
  'kharadi-wagholi': 5,
  'kothrud-bavdhan': 4,
  'kothrud-karve_nagar': 2,
  'kothrud-pashan': 5,
  'kothrud-warje': 3,
  'magarpatta-mundhwa': 3,
  'magarpatta-kharadi': 7,
  'pimple_saudagar-pimple_gurav': 3,
  'pimple_saudagar-wakad': 3,
  'viman_nagar-wadgaon_sheri': 4,
};

/**
 * Get approximate distance in km between two area keys.
 */
function getDistance(keyA, keyB) {
  const pair1 = `${keyA}-${keyB}`;
  const pair2 = `${keyB}-${keyA}`;
  return DISTANCES[pair1] || DISTANCES[pair2] || 8; // default 8km if unknown
}

/**
 * Find the PUNE_AREAS key that best matches a locality name string.
 */
function findAreaKey(localityName) {
  if (!localityName) return null;
  const search = localityName.toLowerCase();

  // Direct key match
  for (const key of Object.keys(PUNE_AREAS)) {
    const normalized = key.replace(/_/g, ' ');
    if (search.includes(normalized) || search.includes(key)) return key;
  }

  // Match against area name
  for (const [key, area] of Object.entries(PUNE_AREAS)) {
    if (search.includes(area.name.toLowerCase())) return key;
  }

  return null;
}

/**
 * Return up to 3 nearby areas that score higher than currentScore.
 */
async function getNearbyAlternatives(localityName, currentScore) {
  try {
    const matchedKey = findAreaKey(localityName);
    if (!matchedKey) return [];

    const currentArea = PUNE_AREAS[matchedKey];
    if (!currentArea) return [];

    const betterNearby = currentArea.nearby
      .map(nearbyKey => {
        // Handle keys that may not be in PUNE_AREAS (e.g. 'pashan', 'sus_road')
        const area = PUNE_AREAS[nearbyKey];
        if (!area) return null;
        if (area.base_score <= currentScore) return null;
        return {
          name: area.name,
          score: area.base_score,
          distance_km: getDistance(matchedKey, nearbyKey),
          improvement: area.base_score - currentScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return betterNearby;
  } catch (err) {
    console.warn('getNearbyAlternatives failed:', err.message);
    return [];
  }
}

module.exports = { getNearbyAlternatives };
