const db = require('../firebase');
const turf = require('@turf/turf');

/**
 * Check if a point falls within any flood hazard zone polygon.
 * GeoJSON is stored as a JSON string in Firestore (due to nesting limits),
 * so we JSON.parse() it before turf checks.
 */
async function getFloodScore(lat, lng) {
  try {
    // Bbox pre-filter: only fetch zones whose lat range overlaps this point
    const snap = await db
      .collection('flood_zones')
      .where('bbox.minLat', '<=', lat)
      .where('bbox.maxLat', '>=', lat)
      .get();

    if (snap.empty) {
      return { score: 70, raw: { in_flood_zone: false, hazard_level: null, note: 'No flood zones in range' } };
    }

    const point = turf.point([lng, lat]);

    for (const doc of snap.docs) {
      const data = doc.data();

      // Also check longitude bbox before expensive polygon check
      if (lng < data.bbox.minLng || lng > data.bbox.maxLng) continue;

      // Parse GeoJSON — stored as string due to Firestore nested array limitation
      let geojson;
      if (typeof data.geojson === 'string') {
        geojson = JSON.parse(data.geojson);
      } else {
        geojson = data.geojson;
      }

      if (turf.booleanPointInPolygon(point, geojson)) {
        return {
          score: 20,
          raw: {
            in_flood_zone: true,
            hazard_level: data.hazard_level || 'Unknown',
          },
        };
      }
    }

    return {
      score: 100,
      raw: { in_flood_zone: false, hazard_level: null },
    };
  } catch (err) {
    return { score: 70, raw: { error: true, message: err.message } };
  }
}

module.exports = { getFloodScore };
