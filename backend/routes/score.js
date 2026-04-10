const express = require('express');
const router = express.Router();

const db = require('../firebase');
const { getAqiScore } = require('../services/aqi');
const { getSchoolScore } = require('../services/schools');
const { getFloodScore } = require('../services/flood');
const { getHealthcareScore } = require('../services/healthcare');
const { getCrimeScore } = require('../services/crime');
const { getTransportScore } = require('../services/transport');
const { getGreeneryScore } = require('../services/greenery');
const { getPropertyScore } = require('../services/property');
const { generateNarratives } = require('../services/gemini');

// Fallback scores if a service promise is rejected
const FALLBACK_SCORES = {
  air_quality: 60,
  school_quality: 50,
  flood_risk: 70,
  healthcare: 50,
  crime_safety: 60,
  transport: 50,
  property_value: 60,
  greenery: 50,
};

/**
 * Run the full scoring pipeline for a given lat/lng.
 */
async function runScoringPipeline(lat, lng, locality_name) {
  // Call all 8 services in parallel — allSettled so one failure doesn't crash others
  const results = await Promise.allSettled([
    getAqiScore(lat, lng),
    getSchoolScore(lat, lng),
    getFloodScore(lat, lng),
    getHealthcareScore(lat, lng, locality_name),
    getCrimeScore(lat, lng),
    getTransportScore(lat, lng, locality_name),
    getGreeneryScore(lat, lng, locality_name),
    getPropertyScore(lat, lng, locality_name),
  ]);

  const keys = [
    'air_quality', 'school_quality', 'flood_risk', 'healthcare',
    'crime_safety', 'transport', 'greenery', 'property_value',
  ];
  const weights = {
    air_quality: '15%',
    school_quality: '20%',
    flood_risk: '15%',
    healthcare: '15%',
    crime_safety: '15%',
    transport: '10%',
    property_value: '5%',
    greenery: '5%',
  };

  // Build dimensions from results, using fallbacks for rejected promises
  const dimensions = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (results[i].status === 'fulfilled') {
      dimensions[key] = {
        score: Math.min(100, Math.max(0, results[i].value.score)),
        weight: weights[key],
        raw: results[i].value.raw,
      };
    } else {
      dimensions[key] = {
        score: FALLBACK_SCORES[key],
        weight: weights[key],
        raw: { error: true, message: results[i].reason?.message || 'Service failed' },
      };
    }
  }

  // Calculate composite score
  const composite = Math.round(
    dimensions.air_quality.score * 0.15 +
    dimensions.school_quality.score * 0.20 +
    dimensions.flood_risk.score * 0.15 +
    dimensions.healthcare.score * 0.15 +
    dimensions.crime_safety.score * 0.15 +
    dimensions.transport.score * 0.10 +
    dimensions.property_value.score * 0.05 +
    dimensions.greenery.score * 0.05
  );

  // Generate AI narratives
  const narratives = await generateNarratives(dimensions, locality_name);

  // Attach narratives to dimensions
  for (const key of Object.keys(dimensions)) {
    dimensions[key].narrative = narratives[key] || '';
  }

  const timestamp = new Date().toISOString();

  const response = {
    locality: locality_name,
    composite: Math.min(100, Math.max(0, composite)),
    cached: false,
    timestamp,
    dimensions,
  };

  // Cache to Firestore
  try {
    const cacheId = locality_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await db.collection('score_cache').doc(cacheId).set({
      ...response,
      cached_at: timestamp,
    });
  } catch (cacheErr) {
    console.error('Cache write failed:', cacheErr.message);
  }

  return response;
}

/**
 * POST /api/score — run full scoring pipeline.
 */
router.post('/', async (req, res) => {
  try {
    const { lat, lng, locality_name } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    const name = locality_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    const response = await runScoringPipeline(latitude, longitude, name);
    res.json(response);
  } catch (err) {
    console.error('Score endpoint error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

/**
 * GET /api/score/:locality — check cache first, else run pipeline.
 */
router.get('/:locality', async (req, res) => {
  try {
    const locality = req.params.locality;
    const cacheId = locality.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Check cache
    const cached = await db.collection('score_cache').doc(cacheId).get();
    if (cached.exists) {
      const data = cached.data();
      const cachedAt = new Date(data.cached_at);
      const hoursAgo = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);

      if (hoursAgo < 24) {
        return res.json({ ...data, cached: true });
      }
    }

    // No valid cache — need lat/lng to run fresh pipeline
    // For GET requests without coordinates, return cached-only or 404
    return res.status(404).json({
      error: 'No cached score found for this locality. Use POST /api/score with lat/lng to generate a new score.',
    });
  } catch (err) {
    console.error('Cache lookup error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

module.exports = router;
