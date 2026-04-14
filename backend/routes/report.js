const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = require('../firebase');

/**
 * GET /api/report/:slug
 * Fetch stored report data by slug from shared_reports collection
 */
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const docRef = db.collection('shared_reports').doc(slug);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Increment view count
    await docRef.update({
      view_count: admin.firestore.FieldValue.increment(1)
    });

    return res.json(docSnap.data());
  } catch (err) {
    console.error('Error fetching shared report:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

module.exports = router;
