const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  // In production (Cloud Run), use Application Default Credentials.
  // Locally, use the service account JSON file.
  const saPath = path.join(__dirname, '..', 'firebase-adminsdk.json');

  if (fs.existsSync(saPath)) {
    const serviceAccount = require(saPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
  } else {
    // Cloud Run provides ADC automatically via the default service account
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

const db = admin.firestore();

module.exports = db;
