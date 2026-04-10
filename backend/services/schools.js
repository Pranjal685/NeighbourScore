const db = require('../firebase');
const ngeohash = require('ngeohash');

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
async function getSchoolScore(lat, lng) {
  try {
    const center = ngeohash.encode(lat, lng, 5);
    const neighbors = ngeohash.neighbors(center);
    const cells = [center, ...Object.values(neighbors)]; // 9 cells

    const snap = await db
      .collection('schools')
      .where('geohash5', 'in', cells)
      .get();

    // Filter by actual haversine distance <= 3km
    const nearbySchools = [];
    snap.forEach((doc) => {
      const d = doc.data();
      const dist = haversine(lat, lng, d.lat, d.lng);
      if (dist <= 3.0) {
        nearbySchools.push({ ...d, distance_km: Math.round(dist * 100) / 100 });
      }
    });

    // Sort by distance and take top 5 for the raw response
    nearbySchools.sort((a, b) => a.distance_km - b.distance_km);

    const count = nearbySchools.length;
    const score = Math.min(100, Math.max(0, count * 10));

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
