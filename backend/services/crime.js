const axios = require('axios');
const db = require('../firebase');
const { getCrimeNews } = require('./newsService');

/**
 * Reverse-geocode to find district, then look up crime_data from Firestore.
 * Also fetches recent news via NewsAPI and attaches to raw data.
 */
async function getCrimeScore(lat, lng, localityName) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return { score: 60, raw: { error: true, note: 'GOOGLE_MAPS_API_KEY not set' } };
    }

    // Step 1: Reverse geocode to get district name
    const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const { data } = await axios.get(geoUrl, {
      params: { latlng: `${lat},${lng}`, key: apiKey },
      timeout: 10000,
    });

    let districtName = null;

    if (data.results && data.results.length > 0) {
      // Try administrative_area_level_3 first (district)
      for (const result of data.results) {
        for (const comp of result.address_components || []) {
          if (comp.types.includes('administrative_area_level_3')) {
            districtName = comp.long_name;
            break;
          }
        }
        if (districtName) break;
      }

      // Fallback to administrative_area_level_2
      if (!districtName) {
        for (const result of data.results) {
          for (const comp of result.address_components || []) {
            if (comp.types.includes('administrative_area_level_2')) {
              districtName = comp.long_name;
              break;
            }
          }
          if (districtName) break;
        }
      }
    }

    // Default to Pune if nothing found
    if (!districtName) districtName = 'Pune';

    // Step 2: Build slug and query Firestore
    const slug = districtName.toLowerCase().replace(/\s+/g, '_');

    // Step 3: Fetch news in parallel with Firestore lookup
    const [doc, recentNews] = await Promise.all([
      db.collection('crime_data').doc(slug).get(),
      getCrimeNews(districtName, localityName || ''),
    ]);

    if (!doc.exists) {
      // Try 'pune' as fallback
      const fallbackDoc = await db.collection('crime_data').doc('pune').get();
      if (fallbackDoc.exists) {
        const fd = fallbackDoc.data();
        return {
          score: Math.min(100, Math.max(0, fd.crime_safety_score)),
          raw: {
            district: 'Pune',
            crime_rate: fd.crime_rate,
            total_crimes: fd.total_crimes,
            recent_news: recentNews,
            note: `District '${districtName}' not found, defaulted to Pune`,
          },
        };
      }
      return { score: 60, raw: { error: true, note: `No crime data for '${slug}'`, recent_news: recentNews } };
    }

    const crimeData = doc.data();
    return {
      score: Math.min(100, Math.max(0, crimeData.crime_safety_score)),
      raw: {
        district: crimeData.district,
        crime_rate: crimeData.crime_rate,
        total_crimes: crimeData.total_crimes,
        population: crimeData.population,
        recent_news: recentNews,
      },
    };
  } catch (err) {
    return { score: 60, raw: { error: true, message: err.message, recent_news: [] } };
  }
}

module.exports = { getCrimeScore };
