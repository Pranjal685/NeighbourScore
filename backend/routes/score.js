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
const { getNearbyAlternatives } = require('../services/alternatives');

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
 * Return weight map for a given profile.
 * All weights in each profile sum to 1.0.
 */
function getWeights(profile) {
  const profiles = {
    general: {
      air_quality: 0.15, school_quality: 0.20, flood_risk: 0.15,
      healthcare: 0.15, crime_safety: 0.15, transport: 0.10,
      property_value: 0.05, greenery: 0.05,
    },
    family: {
      air_quality: 0.15, school_quality: 0.35, flood_risk: 0.10,
      healthcare: 0.10, crime_safety: 0.20, transport: 0.05,
      property_value: 0.02, greenery: 0.03,
    },
    professional: {
      air_quality: 0.15, school_quality: 0.10, flood_risk: 0.03,
      healthcare: 0.15, crime_safety: 0.15, transport: 0.25,
      property_value: 0.15, greenery: 0.02,
    },
    retiree: {
      air_quality: 0.15, school_quality: 0.02, flood_risk: 0.08,
      healthcare: 0.35, crime_safety: 0.18, transport: 0.05,
      property_value: 0.02, greenery: 0.15,
    },
    investor: {
      air_quality: 0.05, school_quality: 0.10, flood_risk: 0.03,
      healthcare: 0.05, crime_safety: 0.05, transport: 0.17,
      property_value: 0.45, greenery: 0.10,
    },
  };
  return profiles[profile] || profiles.general;
}

/**
 * Run the full scoring pipeline for a given lat/lng.
 */
async function runScoringPipeline(lat, lng, locality_name, profile = 'general') {
  // Call all 8 services in parallel — allSettled so one failure doesn't crash others
  const results = await Promise.allSettled([
    getAqiScore(lat, lng, locality_name),
    getSchoolScore(lat, lng, locality_name),
    getFloodScore(lat, lng),
    getHealthcareScore(lat, lng, locality_name),
    getCrimeScore(lat, lng, locality_name),  // now accepts localityName for news
    getTransportScore(lat, lng, locality_name),
    getGreeneryScore(lat, lng, locality_name),
    getPropertyScore(lat, lng, locality_name),
  ]);

  const keys = [
    'air_quality', 'school_quality', 'flood_risk', 'healthcare',
    'crime_safety', 'transport', 'greenery', 'property_value',
  ];

  const weights = getWeights(profile);

  // Build dimensions from results, using fallbacks for rejected promises
  const dimensions = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const weightPct = `${Math.round(weights[key] * 100)}%`;
    if (results[i].status === 'fulfilled') {
      dimensions[key] = {
        score: Math.min(100, Math.max(0, results[i].value.score)),
        weight: weightPct,
        raw: results[i].value.raw,
      };
    } else {
      dimensions[key] = {
        score: FALLBACK_SCORES[key],
        weight: weightPct,
        raw: { error: true, message: results[i].reason?.message || 'Service failed' },
      };
    }
  }

  // Calculate composite score using profile weights
  const composite = Math.round(
    dimensions.air_quality.score    * weights.air_quality +
    dimensions.school_quality.score * weights.school_quality +
    dimensions.flood_risk.score     * weights.flood_risk +
    dimensions.healthcare.score     * weights.healthcare +
    dimensions.crime_safety.score   * weights.crime_safety +
    dimensions.transport.score      * weights.transport +
    dimensions.property_value.score * weights.property_value +
    dimensions.greenery.score       * weights.greenery
  );

  // Generate AI narratives (profile-aware) and nearby alternatives in parallel
  const [narratives, nearby_alternatives] = await Promise.all([
    generateNarratives(dimensions, locality_name, profile),
    getNearbyAlternatives(locality_name, composite),
  ]);

  // Attach narratives to dimensions
  for (const key of Object.keys(dimensions)) {
    dimensions[key].narrative = narratives[key] || '';
  }

  const timestamp = new Date().toISOString();

  const response = {
    locality: locality_name,
    composite: Math.min(100, Math.max(0, composite)),
    profile,
    weights_used: weights,
    cached: false,
    timestamp,
    dimensions,
    nearby_alternatives,
  };

  // Cache to Firestore (include profile in cache key so different profiles don't clash)
  try {
    const baseId = locality_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cacheId = profile === 'general' ? baseId : `${baseId}_${profile}`;
    await db.collection('score_cache').doc(cacheId).set({
      ...response,
      cached_at: timestamp,
    });
  } catch (cacheErr) {
    console.error('Cache write failed:', cacheErr.message);
  }

  return response;
}

// In-memory cache for scoring results (avoids stale Firestore entries, fast for repeated requests)
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/score — run full scoring pipeline.
 */
router.post('/', async (req, res) => {
  try {
    const { lat, lng, locality_name, profile } = req.body;

    // Validate lat and lng exist
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    // Validate India bounding box
    if (latitude < 6.5 || latitude > 37.5 || longitude < 68.0 || longitude > 97.5) {
      return res.status(400).json({
        error: 'Coordinates must be within India bounding box',
      });
    }

    // Sanitize locality_name — strip HTML tags and injection characters, cap at 100 chars
    const sanitizedLocality = String(locality_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      .replace(/<[^>]*>/g, '')    // strip HTML tags
      .replace(/['"`;]/g, '')     // strip injection chars
      .trim()
      .substring(0, 100);

    // Validate profile — unknown profiles fall back to general
    const validProfiles = ['general', 'family', 'professional', 'retiree', 'investor'];
    const sanitizedProfile = validProfiles.includes(profile) ? profile : 'general';

    // Check in-memory cache first
    const cacheKey = `${sanitizedLocality.toLowerCase()}_${sanitizedProfile}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < MEMORY_CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const response = await runScoringPipeline(latitude, longitude, sanitizedLocality, sanitizedProfile);
    memoryCache.set(cacheKey, { data: response, timestamp: Date.now() });
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
    return res.status(404).json({
      error: 'No cached score found for this locality. Use POST /api/score with lat/lng to generate a new score.',
    });
  } catch (err) {
    console.error('Cache lookup error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

module.exports = router;
