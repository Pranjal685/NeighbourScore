Read CLAUDE.md for full project context before starting anything.

You are now building Phase 2 — the complete backend for NeighbourScore.

Working directory: C:\Users\Pranjal\OneDrive\Desktop\NeighbourScore\backend

=============================================================
STEP 1 — INSTALL DEPENDENCIES
=============================================================

Run this in the backend/ folder:
npm install express firebase-admin axios dotenv cors ngeohash @turf/turf @google/generative-ai

=============================================================
STEP 2 — CREATE backend/firebase.js
=============================================================

Initialize Firebase Admin SDK using the service account file at ../firebase-adminsdk.json
Export a single Firestore db instance.
Use admin.apps.length check to prevent re-initialization.
Load FIREBASE_PROJECT_ID from process.env.

=============================================================
STEP 3 — CREATE backend/services/aqi.js
=============================================================

Export async function getAqiScore(lat, lng).

Call CPCB API:
URL: https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69
Params: api-key from process.env.CPCB_API_KEY, format=json, limit=100

From the response records array, find the station with the shortest haversine distance to the given lat/lng. Each record has latitude and longitude fields.

Extract AQI from pollutant_avg field of that nearest station.

Score mapping:
- AQI 0-50   → score 100
- AQI 51-100  → score 80
- AQI 101-150 → score 60
- AQI 151-200 → score 40
- AQI 200+    → score 20

Return { score, raw: { aqi, station_name, distance_km } }
On any error or missing CPCB_API_KEY, return { score: 60, raw: { error: true } }

=============================================================
STEP 4 — CREATE backend/services/schools.js
=============================================================

Export async function getSchoolScore(lat, lng).

Import db from ../firebase.js
Import ngeohash.

Encode center cell at precision 6.
Get 8 neighbors using ngeohash.neighbors(center).
Build cells array of 9 total cells: [center, ...Object.values(neighbors)]

Query: db.collection('schools').where('geohash6', 'in', cells)

Filter results to only schools within 3.0 km using haversine distance.

Score = count of nearby schools × 10, capped at 100.

Return { score, raw: { count, schools: top 5 nearest [{name, lat, lng, category, distance_km}] } }
On any error return { score: 50, raw: { error: true } }

=============================================================
STEP 5 — CREATE backend/services/flood.js
=============================================================

Export async function getFloodScore(lat, lng).

Import db from ../firebase.js
Import @turf/turf as turf.

Query flood_zones collection with bbox pre-filter:
db.collection('flood_zones')
  .where('bbox.minLat', '<=', lat)
  .where('bbox.maxLat', '>=', lat)

For each result document, run:
turf.booleanPointInPolygon(turf.point([lng, lat]), doc.data().geojson)

If any polygon contains the point → in_flood_zone = true, get hazard_level from that document.

Score: in_flood_zone = 20, not in zone = 100

Return { score, raw: { in_flood_zone, hazard_level } }
If collection is empty or query fails, return { score: 70, raw: { error: true } }

=============================================================
STEP 6 — CREATE backend/services/healthcare.js
=============================================================

Export async function getHealthcareScore(lat, lng).

Call Google Maps Places Nearby Search API:
URL: https://maps.googleapis.com/maps/api/place/nearbysearch/json
Params: location=${lat},${lng}, radius=3000, type=hospital, key=process.env.GOOGLE_MAPS_API_KEY

Score = results.length × 12, capped at 100.

Return { score, raw: { count, hospitals: top 5 [{name, rating, vicinity}] } }
On any error return { score: 50, raw: { error: true } }

=============================================================
STEP 7 — CREATE backend/services/crime.js
=============================================================

Export async function getCrimeScore(lat, lng).

Step 1: Reverse geocode using Google Maps Geocoding API:
URL: https://maps.googleapis.com/maps/api/geocode/json
Params: latlng=${lat},${lng}, key=process.env.GOOGLE_MAPS_API_KEY

Extract district name from address_components where types includes 'administrative_area_level_3'.
If not found, try 'administrative_area_level_2'.
Default to 'pune' if nothing found.

Step 2: Build slug = districtName.toLowerCase().replace(/\s+/g, '_')

Step 3: Query db.collection('crime_data').doc(slug).get()

Return { score: doc.data().crime_safety_score, raw: { district, crime_rate, total_crimes } }
On any error return { score: 60, raw: { error: true } }

=============================================================
STEP 8 — CREATE backend/services/transport.js
=============================================================

Export async function getTransportScore(lat, lng).

Call Google Maps Places Nearby Search:
type=bus_station, radius=500, key=GOOGLE_MAPS_API_KEY

Score = results.length × 15, capped at 100.

Return { score, raw: { count, stops: top 5 [{name, vicinity}] } }
On any error return { score: 50, raw: { error: true } }

=============================================================
STEP 9 — CREATE backend/services/greenery.js
=============================================================

Export async function getGreeneryScore(lat, lng).

Call Google Maps Places Nearby Search:
type=park, radius=1000, key=GOOGLE_MAPS_API_KEY

Score = results.length × 20, capped at 100.

Return { score, raw: { count, parks: top 5 [{name, vicinity}] } }
On any error return { score: 50, raw: { error: true } }

=============================================================
STEP 10 — CREATE backend/services/property.js
=============================================================

Export async function getPropertyScore(lat, lng, localityName).

Hardcode this Pune locality price map (match locality_name case-insensitively):
{
  "wakad":            { price_per_sqft: 8200,  trend_12m_pct: 8  },
  "baner":            { price_per_sqft: 9500,  trend_12m_pct: 11 },
  "kothrud":          { price_per_sqft: 10200, trend_12m_pct: 6  },
  "hinjewadi":        { price_per_sqft: 7800,  trend_12m_pct: 9  },
  "viman nagar":      { price_per_sqft: 10800, trend_12m_pct: 7  },
  "koregaon park":    { price_per_sqft: 14000, trend_12m_pct: 5  },
  "hadapsar":         { price_per_sqft: 7500,  trend_12m_pct: 10 },
  "pimple saudagar":  { price_per_sqft: 7900,  trend_12m_pct: 8  },
  "aundh":            { price_per_sqft: 11000, trend_12m_pct: 6  },
  "kharadi":          { price_per_sqft: 8800,  trend_12m_pct: 12 },
  "magarpatta":       { price_per_sqft: 9200,  trend_12m_pct: 7  },
  "kalyani nagar":    { price_per_sqft: 11500, trend_12m_pct: 5  },
  "pune":             { price_per_sqft: 7500,  trend_12m_pct: 5  }
}

Match by checking if localityName.toLowerCase() includes any key from the map.

Score mapping based on trend_12m_pct:
- trend > 10%  → score 90
- trend 5-10%  → score 75
- trend 0-5%   → score 60
- trend negative → score 40

Default if no match: { price_per_sqft: 7500, trend_12m_pct: 5, score: 60 }

Return { score, raw: { locality_matched, price_per_sqft, trend_12m_pct, source: 'aggregated_2024' } }
Never throw error from this service.

=============================================================
STEP 11 — CREATE backend/services/gemini.js
=============================================================

Export async function generateNarratives(dimensions, localityName).

Use @google/generative-ai package.
Model: gemini-1.5-flash
API key from process.env.GEMINI_API_KEY.

Build a single prompt that requests narratives for all 8 dimensions at once to minimize API calls:

"You are NeighbourScore AI, a neighborhood intelligence assistant helping Indian families make housing decisions. Generate a 2-sentence plain English narrative for each of the 8 dimensions below for the locality: {localityName}. Use the actual score and raw numbers in your response. Write as if advising a family with young children. Be specific and practical, not generic.

Dimensions data:
{JSON.stringify(dimensions, null, 2)}

Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation:
{
  'air_quality': 'narrative here',
  'school_quality': 'narrative here', 
  'flood_risk': 'narrative here',
  'healthcare': 'narrative here',
  'crime_safety': 'narrative here',
  'transport': 'narrative here',
  'property_value': 'narrative here',
  'greenery': 'narrative here'
}"

Parse the JSON response from Gemini.
Strip any markdown code fences (```json ... ```) before parsing.

If Gemini fails or JSON parsing fails, return these fallback narratives based on score:
- score >= 80: "This dimension scores excellently for {localityName}. It is well above average for Pune."
- score >= 60: "This dimension scores moderately for {localityName}. It is around the Pune average."
- score < 60:  "This dimension scores below average for {localityName}. Consider this carefully before deciding."

Return object: { air_quality, school_quality, flood_risk, healthcare, crime_safety, transport, property_value, greenery }

=============================================================
STEP 12 — CREATE backend/routes/score.js
=============================================================

Import all 8 services and gemini.js.
Import db from ../firebase.js.

POST / handler:
1. Validate request body has lat and lng. Return 400 if missing.
2. Parse lat and lng as floats.
3. Call all 8 services in parallel using Promise.allSettled (not Promise.all — one failure must not crash others):
   - getAqiScore(lat, lng)
   - getSchoolScore(lat, lng)
   - getFloodScore(lat, lng)
   - getHealthcareScore(lat, lng)
   - getCrimeScore(lat, lng)
   - getTransportScore(lat, lng)
   - getGreeneryScore(lat, lng)
   - getPropertyScore(lat, lng, locality_name)

4. For any rejected promise, use the fallback score for that service.

5. Build dimensions object with all 8 results including score, weight, and raw data.

6. Calculate composite score:
   composite = Math.round(
     air_quality.score   * 0.15 +
     school_quality.score * 0.20 +
     flood_risk.score    * 0.15 +
     healthcare.score    * 0.15 +
     crime_safety.score  * 0.15 +
     transport.score     * 0.10 +
     property_value.score * 0.05 +
     greenery.score      * 0.05
   )

7. Call generateNarratives(dimensions, locality_name) to get AI narratives.
   Add narrative string to each dimension object.

8. Cache the result in Firestore collection 'score_cache' with document ID = 
   locality_name.toLowerCase().replace(/\s+/g, '_')
   Include a timestamp field for cache expiry checking.

9. Return full response:
{
  locality: locality_name,
  composite: number,
  cached: false,
  timestamp: ISO string,
  dimensions: {
    air_quality:    { score, weight: '15%', raw, narrative },
    school_quality: { score, weight: '20%', raw, narrative },
    flood_risk:     { score, weight: '15%', raw, narrative },
    healthcare:     { score, weight: '15%', raw, narrative },
    crime_safety:   { score, weight: '15%', raw, narrative },
    transport:      { score, weight: '10%', raw, narrative },
    property_value: { score, weight: '5%',  raw, narrative },
    greenery:       { score, weight: '5%',  raw, narrative }
  }
}

Also add GET / handler that checks cache first:
- If cached result exists and is less than 24 hours old, return it with cached: true
- Otherwise run full scoring pipeline

=============================================================
STEP 13 — CREATE backend/index.js
=============================================================

Load dotenv from '../.env' path.
Initialize Express app.
Add cors() middleware.
Add express.json() middleware.

Mount routes:
- GET  /health → return { status: 'ok', timestamp: new Date().toISOString() }
- POST /api/score → score router
- GET  /api/score/:locality → GET handler from score router for cached lookups

Start server on process.env.PORT || 3000.
Log: "NeighbourScore backend running on port {PORT}"

=============================================================
STEP 14 — ADD TO .env
=============================================================

Add this line to the root .env file if not already present:
CPCB_API_KEY=your_cpcb_key_here

Tell the user: Get free CPCB API key by registering at https://data.gov.in — click register, verify email, then go to profile to find your API key.

=============================================================
STEP 15 — TEST THE BACKEND
=============================================================

Start the server:
node index.js

Test with this curl command:
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d "{\"lat\":18.5974,\"lng\":73.7898,\"locality_name\":\"Wakad, Pune\"}"

Expected: JSON response with composite score between 0-100 and all 8 dimensions populated with scores and narratives.

Also test health endpoint:
curl http://localhost:3000/health

If any service returns an error in the raw field, that is acceptable — it means that API key is not yet configured. The score should still return using the fallback value.

Report back with the full JSON response from the Wakad test so we can verify all 8 dimensions are working correctly.

=============================================================
CRITICAL RULES — FOLLOW THESE WITHOUT EXCEPTION
=============================================================

1. Never hardcode any API key — always use process.env
2. Use Promise.allSettled not Promise.all in the score route — one failing API must never crash the entire endpoint
3. Every service file must have its own try/catch and return a fallback score on error
4. All scores must be clamped between 0 and 100 using Math.min(100, Math.max(0, score))
5. Composite score must always be a whole number using Math.round
6. The Gemini narrative must always fall back gracefully if the API call fails
7. dotenv must be loaded before any other imports in index.js
8. firebase.js must check admin.apps.length before initializing to prevent duplicate app error
9. Use require() not import/export — this is a CommonJS Node.js project
10. After completing all steps, show the full test response in the terminal