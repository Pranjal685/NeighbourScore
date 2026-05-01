const axios = require('axios');
const db = require('../firebase');
const ngeohash = require('ngeohash');

// Mumbai bounding box — all requests inside this bbox go to Places API
const MUMBAI_BBOX = { minLat: 18.85, maxLat: 19.35, minLng: 72.75, maxLng: 73.10 };

function isMumbai(lat, lng) {
  return lat >= MUMBAI_BBOX.minLat && lat <= MUMBAI_BBOX.maxLat &&
         lng >= MUMBAI_BBOX.minLng && lng <= MUMBAI_BBOX.maxLng;
}

function schoolCountToScore(count) {
  if (count === 0) return 20;
  if (count <= 2) return 40;
  if (count <= 5) return 60;
  if (count <= 9) return 75;
  return 90;
}

async function getMumbaiSchoolScore(lat, lng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { score: 50, raw: { count: 0, source: 'google_places', error: 'no_api_key' } };

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const { data } = await axios.get(url, {
      params: { location: `${lat},${lng}`, radius: 3000, type: 'school', key: apiKey },
      timeout: 10000,
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return { score: 50, raw: { count: 0, source: 'google_places', api_status: data.status } };
    }

    const results = data.results || [];
    const count = results.length;
    const score = schoolCountToScore(count);

    console.log(`[Schools] Mumbai Places API: ${count} schools found → score ${score}`);

    return {
      score,
      raw: {
        count,
        source: 'google_places',
        schools: results.slice(0, 5).map((r) => ({
          name: r.name,
          vicinity: r.vicinity || '',
          rating: r.rating || null,
        })),
      },
    };
  } catch (err) {
    console.error('[Schools] Mumbai Places API error:', err.message);
    return { score: 50, raw: { count: 0, source: 'google_places', error: err.message } };
  }
}

// Locality-based school score fallbacks (CBSE school density per area)
// Used when geohash returns sparse results (likely incomplete Firestore data)
const SCHOOL_LOCALITY_SCORES = {
  'koregaon park': 75, 'baner': 70, 'aundh': 78, 'kothrud': 68,
  'wakad': 60, 'hinjewadi': 44, 'viman nagar': 68, 'hadapsar': 58,
  'kharadi': 62, 'pimple saudagar': 58, 'magarpatta': 52,
  'kalyani nagar': 82, 'dhanori': 35, 'chinchwad': 52, 'nibm': 48,
  'kondhwa': 45, 'katraj': 42, 'wagholi': 40, 'warje': 50,
  // Generic entries last — prevents ", Pune" suffix from matching prematurely
  'pimpri': 55, 'pune': 65,
};

/**
 * Haversine distance in km.
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
 * Query CBSE schools within ~3km using geohash proximity.
 */
async function getSchoolScore(lat, lng, localityName) {
  if (isMumbai(lat, lng)) {
    console.log(`[Schools] Mumbai bbox hit (${lat}, ${lng}) → Places API`);
    return getMumbaiSchoolScore(lat, lng);
  }

  try {
    const center = ngeohash.encode(lat, lng, 5);
    const neighbors = ngeohash.neighbors(center);
    const cells = [center, ...Object.values(neighbors)]; // 9 cells

    console.log('[Schools] Geohash center:', center);
    console.log('[Schools] Cells:', cells);

    const snap = await db
      .collection('schools')
      .where('geohash5', 'in', cells)
      .get();

    console.log('[Schools] Raw results:', snap.docs.length);

    // Filter by actual haversine distance <= 3km
    const nearbySchools = [];
    snap.forEach((doc) => {
      const d = doc.data();
      const dist = haversine(lat, lng, d.lat, d.lng);
      if (dist <= 3.0) {
        nearbySchools.push({ ...d, distance_km: Math.round(dist * 100) / 100 });
      }
    });

    console.log('[Schools] After distance filter:', nearbySchools.length);

    // Sort by distance and take top 5 for the raw response
    nearbySchools.sort((a, b) => a.distance_km - b.distance_km);

    const count = nearbySchools.length;
    let score = Math.min(100, Math.max(0, count * 10));

    if (localityName) {
      const search = localityName.toLowerCase();
      for (const [key, fallbackScore] of Object.entries(SCHOOL_LOCALITY_SCORES)) {
        if (search.includes(key)) {
          if (count < 5) {
            // Sparse geohash results — use calibrated fallback as minimum floor
            score = Math.max(score, fallbackScore);
            console.log(`[Schools] Sparse results — using locality fallback for '${key}': ${fallbackScore}`);
          } else {
            // Many schools found — blend 50/50 to prevent IT-zone inflation
            // (geohash can pick up schools from neighbouring residential pockets)
            score = Math.round((score + fallbackScore) / 2);
            console.log(`[Schools] Blending geohash(${score * 2 - fallbackScore}) + fallback(${fallbackScore}) → ${score}`);
          }
          break;
        }
      }
    }

    return {
      score,
      raw: {
        count,
        schools: nearbySchools.slice(0, 5).map((s) => ({
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          category: s.category,
          distance_km: s.distance_km,
        })),
      },
    };
  } catch (err) {
    return { score: 50, raw: { error: true, message: err.message } };
  }
}

module.exports = { getSchoolScore };
