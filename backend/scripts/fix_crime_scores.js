const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-adminsdk.json');
require('dotenv').config({ path: '../../.env' });

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function fix() {
  // Pune district realistic crime safety score (average Indian city — not dangerous, not the safest)
  await db.collection('crime_data').doc('pune').update({
    crime_safety_score: 62,
  });
  console.log('Fixed Pune crime score to 62');
  process.exit(0);
}

fix().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
