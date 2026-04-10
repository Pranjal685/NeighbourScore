# CLAUDE.md — NeighbourScore
## AI Neighborhood Intelligence Platform
### Google Solution Challenge 2026 | Hack2Skill | Open Innovation Track (PS5)
### Prize Pool: ₹10,00,000 | Deadline: April 24, 2026

---

## WHAT IS NEIGHBOURSCORE?

NeighbourScore is an AI-powered neighborhood intelligence platform that gives Indian homebuyers and renters an objective, data-backed score for any locality before they sign a lease or commit to a purchase. Think of it as a credit score, but for neighborhoods.

A user types any area or housing society name in Pune, and NeighbourScore returns an 8-dimension report card calculated entirely from verified government and public data — no user reviews, no unverifiable opinions.

**One-line pitch:** Google Maps tells you what is near you. NeighbourScore tells you how good your neighborhood actually is — using AQI data, flood risk zones, school board results, and crime statistics that Google Maps does not have.

**Validated by 50,000+ Indians** — scored 94.5/100 on Razorpay's Fix My Itch platform. Highest-ranked Real Estate problem on the platform.

**Demo city:** Pune (deep local knowledge, multiple CPCB stations, good data coverage)

---

## PROJECT STRUCTURE

```
C:\Users\Pranjal\OneDrive\Desktop\NeighbourScore\
├── backend/
│   ├── index.js
│   ├── firebase.js
│   ├── routes/
│   │   └── score.js
│   └── services/
│       ├── aqi.js
│       ├── schools.js
│       ├── flood.js
│       ├── healthcare.js
│       ├── crime.js
│       ├── transport.js
│       ├── greenery.js
│       ├── property.js
│       └── gemini.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.css
│       ├── components/
│       │   ├── SearchBar.jsx
│       │   ├── ScoreGauge.jsx
│       │   ├── DimensionCard.jsx
│       │   ├── ReportCard.jsx
│       │   ├── MapView.jsx
│       │   └── CompareMode.jsx
│       └── services/
│           └── api.js
├── data-prep/
│   ├── ingest_schools.py
│   ├── ingest_flood.py
│   └── ingest_crime.py
├── .env                        ← NEVER commit this
├── .gitignore
├── firebase-adminsdk.json      ← NEVER commit this
└── README.md
```

---

## ENVIRONMENT VARIABLES

All environment variables live in the root `.env` file. Never hardcode any key anywhere in the codebase.

```
# Root .env
GOOGLE_MAPS_API_KEY=<set by developer>
GEMINI_API_KEY=<set by developer>
FIREBASE_PROJECT_ID=neighbourscore-492917
PORT=3000
CPCB_API_KEY=<get free from data.gov.in — register and copy from profile>
```

```
# frontend/.env
REACT_APP_GOOGLE_MAPS_API_KEY=<same as GOOGLE_MAPS_API_KEY above>
REACT_APP_API_URL=http://localhost:3000
```

---

## TECH STACK

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React.js + Tailwind CSS | Fast to build, clean component reuse for report card |
| Backend | Node.js + Express | Simple REST API, easy Firebase integration |
| Database | Firebase Firestore | Free tier generous, no SQL setup, real-time |
| Maps & Geocoding | Google Maps JavaScript API + Geocoding API | Required for hackathon Google tech stack |
| AI Layer | Gemini API (gemini-1.5-flash) | Free tier, generates narrative summaries per score |
| Geospatial | GeoPandas (Python, run once) | Process NDMA shapefiles into Firebase GeoJSON |
| Hosting | Firebase Hosting | Free, fast deployment, judges get a live URL |
| Data Caching | Firebase Firestore | Cache processed scores per locality for instant repeat queries |

---

## THE 8 SCORING DIMENSIONS

Every dimension returns a score from 0 to 100. Higher is always better. Weights sum to 100%.

| # | Dimension | Weight | Data Source | Score Logic |
|---|---|---|---|---|
| 1 | Air Quality | 15% | CPCB API via data.gov.in (live JSON) | AQI 0-50=100, 51-100=80, 101-150=60, 151-200=40, 200+=20 |
| 2 | School Quality | 20% | Firestore `schools` collection (CBSE CSV, pre-loaded) | Count of CBSE schools within 3km × 10, capped at 100 |
| 3 | Flood Risk | 15% | Firestore `flood_zones` collection (NDMA shapefiles, pre-loaded) | In flood zone=20, not in zone=100 |
| 4 | Healthcare Access | 15% | Google Maps Places API — hospitals within 3km | Count of hospitals × 12, capped at 100 |
| 5 | Crime Safety | 15% | Firestore `crime_data` collection (NCRB 2023, pre-loaded) | Inverse normalised crime rate per 100,000 population |
| 6 | Transport Connectivity | 10% | Google Maps Places API — bus stops within 500m | Count of bus stops × 15, capped at 100 |
| 7 | Property Value Trend | 5% | Hardcoded Pune locality map (demo) | Trend >10%=90, 5-10%=75, 0-5%=60, negative=40 |
| 8 | Greenery & Walkability | 5% | Google Maps Places API — parks within 1km | Count of parks × 20, capped at 100 |

**Composite score formula:**
```
composite = (air_quality × 0.15) + (school × 0.20) + (flood × 0.15) +
            (healthcare × 0.15) + (crime × 0.15) + (transport × 0.10) +
            (property × 0.05) + (greenery × 0.05)
```

---

## FIREBASE FIRESTORE COLLECTIONS

### `schools` collection
Populated by `data-prep/ingest_schools.py`. Each document keyed by `affiliation_no`.
```json
{
  "name": "Delhi Public School",
  "state": "Maharashtra",
  "district": "Pune",
  "city": "Wakad",
  "pincode": "411057",
  "lat": 18.598,
  "lng": 73.761,
  "geohash": "tfen4d2e",
  "geohash6": "tfen4d",
  "geohash5": "tfen4",
  "affiliation_no": "1130123",
  "category": "Sr. Secondary",
  "pass_pct": 94.5,
  "school_score": 82.0
}
```

**Query pattern (3km radius):**
```javascript
const ngeohash = require('ngeohash');
const center = ngeohash.encode(lat, lng, 6);
const neighbors = ngeohash.neighbors(center);
const cells = [center, ...Object.values(neighbors)]; // 9 cells
const snap = await db.collection('schools').where('geohash6', 'in', cells).get();
// Then filter by actual haversine distance <= 3km
```

**Required Firestore composite index:**
- Collection: `schools` | Fields: `geohash6` ASC, `state` ASC

---

### `flood_zones` collection
Populated by `data-prep/ingest_flood.py`. Each document keyed by `flood_{index}`.
```json
{
  "hazard_level": "High",
  "district": "Pune",
  "state": "Maharashtra",
  "geojson": { "type": "Polygon", "coordinates": [[[lng, lat], ...]] },
  "bbox": { "minLat": 18.4, "maxLat": 18.7, "minLng": 73.7, "maxLng": 74.0 }
}
```

**Query pattern (point-in-polygon):**
```javascript
const turf = require('@turf/turf');
// Step 1: Cheap bbox pre-filter
const snap = await db.collection('flood_zones')
  .where('bbox.minLat', '<=', lat)
  .where('bbox.maxLat', '>=', lat)
  .get();
// Step 2: Exact polygon check
const point = turf.point([lng, lat]);
const inZone = snap.docs.some(doc =>
  turf.booleanPointInPolygon(point, doc.data().geojson)
);
```

**Required Firestore composite index:**
- Collection: `flood_zones` | Fields: `bbox.minLat` ASC, `bbox.maxLat` ASC

---

### `crime_data` collection
Populated by `data-prep/ingest_crime.py`. Each document keyed by district slug (e.g. `pune`, `mumbai`).
```json
{
  "district": "Pune",
  "state": "Maharashtra",
  "total_crimes": 55000,
  "population": 9500000,
  "crime_rate": 578.9,
  "crime_safety_score": 72.0,
  "year": 2023,
  "categories": {}
}
```

**Query pattern:**
```javascript
// Resolve district from lat/lng using Google Maps Geocoding API
// then:
const slug = districtName.toLowerCase().replace(/\s+/g, '_');
const doc = await db.collection('crime_data').doc(slug).get();
const score = doc.data().crime_safety_score;
```

---

## BACKEND API SPECIFICATION

### POST /api/score

**Request:**
```json
{
  "lat": 18.5204,
  "lng": 73.8567,
  "locality_name": "Wakad, Pune"
}
```

**Response:**
```json
{
  "locality": "Wakad, Pune",
  "composite": 74,
  "dimensions": {
    "air_quality":    { "score": 80, "weight": "15%", "raw": { "aqi": 87, "station": "Pune" }, "narrative": "Air quality in Wakad averages AQI 87 — moderate. November to January are the worst months for PM2.5 levels, which can affect children with respiratory conditions." },
    "school_quality": { "score": 70, "weight": "20%", "raw": { "count": 7 }, "narrative": "..." },
    "flood_risk":     { "score": 100, "weight": "15%", "raw": { "in_flood_zone": false }, "narrative": "..." },
    "healthcare":     { "score": 60, "weight": "15%", "raw": { "count": 5 }, "narrative": "..." },
    "crime_safety":   { "score": 72, "weight": "15%", "raw": { "district": "Pune", "crime_rate": 578.9 }, "narrative": "..." },
    "transport":      { "score": 45, "weight": "10%", "raw": { "count": 3 }, "narrative": "..." },
    "property_value": { "score": 75, "weight": "5%",  "raw": { "price_per_sqft": 8200, "trend_pct": 7 }, "narrative": "..." },
    "greenery":       { "score": 60, "weight": "5%",  "raw": { "count": 3 }, "narrative": "..." }
  }
}
```

**GET /health** → `{ "status": "ok" }`

---

## BACKEND SERVICES — DETAILED IMPLEMENTATION RULES

### General rules for ALL services:
- Every service must be wrapped in try/catch
- Every service must return a fallback score on any error (listed below)
- Never let one failing service crash the entire /api/score endpoint
- All services receive (lat, lng) as arguments
- All services return { score: number, raw: object }

### Fallback scores:
```
aqi.js        → 60
schools.js    → 50
flood.js      → 70
healthcare.js → 50
crime.js      → 60
transport.js  → 50
property.js   → 60
greenery.js   → 50
```

### aqi.js
- CPCB API endpoint: `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${CPCB_API_KEY}&format=json&limit=100`
- Response contains array of monitoring stations with `pollutant_avg`, `latitude`, `longitude`, `station`
- Find the nearest station to given lat/lng using haversine distance
- Extract AQI value from `pollutant_avg` field
- Score mapping: 0-50=100, 51-100=80, 101-150=60, 151-200=40, 200+=20
- raw: { aqi, station_name, pm25, pm10, distance_km }
- If CPCB_API_KEY is missing from env, return fallback score 60 with note in raw

### schools.js
- Use ngeohash library: `const ngeohash = require('ngeohash')`
- Encode center at precision 6: `ngeohash.encode(lat, lng, 6)`
- Get 8 neighbors: `ngeohash.neighbors(center)` returns { n, ne, e, se, s, sw, w, nw }
- Build cells array: `[center, ...Object.values(neighbors)]` — 9 cells total
- Firestore query: `db.collection('schools').where('geohash6', 'in', cells)`
- Filter results with haversine distance <= 3.0 km
- Score = count of schools within 3km × 10, capped at 100
- raw: { count, schools: [{name, lat, lng, category, school_score}] }

### flood.js
- Firestore query with bbox pre-filter: `.where('bbox.minLat', '<=', lat).where('bbox.maxLat', '>=', lat)`
- Then turf point-in-polygon: `turf.booleanPointInPolygon(turf.point([lng, lat]), doc.data().geojson)`
- Score: in zone = 20, not in zone = 100
- raw: { in_flood_zone: boolean, hazard_level: string or null }
- If flood_zones collection is empty (data prep not done yet), return score 70

### healthcare.js
- Google Maps Places API nearby search
- URL: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=hospital&key=${GOOGLE_MAPS_API_KEY}`
- Score = count of results × 12, capped at 100
- raw: { count, hospitals: [{name, rating, vicinity}] }

### crime.js
- Step 1: Reverse geocode using Google Maps: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
- Step 2: Find address component with type `administrative_area_level_3` for district
- Step 3: Build slug: `districtName.toLowerCase().replace(/\s+/g, '_')`
- Step 4: Query `crime_data` collection by slug
- raw: { district, crime_rate, total_crimes, population }

### transport.js
- Google Maps Places nearby search: type=bus_station, radius=500m
- Score = count × 15, capped at 100
- raw: { count, stops: [{name, vicinity}] }

### greenery.js
- Google Maps Places nearby search: type=park, radius=1000m
- Score = count × 20, capped at 100
- raw: { count, parks: [{name, vicinity}] }

### property.js
- Hardcoded map of Pune localities for the demo
- Map must include at minimum: Wakad, Baner, Kothrud, Hinjewadi, Viman Nagar, Koregaon Park, Hadapsar, Pimple Saudagar, Aundh, Kharadi, Magarpatta, Pune
- Each entry: { price_per_sqft, trend_12m_pct, demand_level }
- Match locality_name against this map (case insensitive, partial match)
- Score: trend > 10% = 90, 5-10% = 75, 0-5% = 60, negative = 40
- Default if not found: { price_per_sqft: 7500, trend_12m_pct: 5 }
- raw: { locality, price_per_sqft, trend_12m_pct, source: 'aggregated_2024' }

### gemini.js
- Use `@google/generative-ai` package
- Model: `gemini-1.5-flash` (free tier)
- Export async function: `generateNarratives(dimensions, localityName)`
- Send ONE prompt to Gemini with all 8 dimensions bundled together to save API calls
- Prompt format:
  ```
  You are NeighbourScore AI, a neighborhood intelligence assistant for Indian homebuyers.
  Generate a 2-sentence plain English narrative for each of the following 8 dimensions
  for the locality: {localityName}.
  
  For each dimension, use the actual numbers in your response. Write for a family
  with young children considering moving to this area. Be specific and practical.
  
  Dimensions data:
  {JSON.stringify(dimensions)}
  
  Respond in JSON format only, with this structure:
  {
    "air_quality": "narrative here",
    "school_quality": "narrative here",
    "flood_risk": "narrative here",
    "healthcare": "narrative here",
    "crime_safety": "narrative here",
    "transport": "narrative here",
    "property_value": "narrative here",
    "greenery": "narrative here"
  }
  ```
- Parse the JSON response and return the narratives object
- If Gemini fails, return default narratives for each dimension based on score bands

---

## FRONTEND COMPONENTS — DETAILED SPECIFICATION

### Design Language
- Color palette: Deep navy (#0f172a) background, white cards, accent color #6366f1 (indigo)
- Score colors: green (#22c55e) for 80-100, amber (#f59e0b) for 60-79, red (#ef4444) for 0-59
- Font: Use Google Fonts — `DM Sans` for body, `DM Serif Display` for headings
- Cards: rounded-2xl, subtle shadow, white background on dark navy page
- Animations: smooth fade-in on load, score gauge animates from 0 to final value on mount
- Mobile responsive — works on phone (judges may test on mobile)

### App.js — State machine
Three states: `search` | `loading` | `results`
- `search`: centered SearchBar on full-height page with tagline "Know your neighborhood before you move."
- `loading`: centered spinner with animated dots and text "Analyzing {localityName}..."
- `results`: full ReportCard + MapView + CompareMode button

### SearchBar.jsx
- Google Places Autocomplete restricted to Pune region
- componentRestrictions: { country: 'in' }
- bounds: Pune metropolitan area
- On place selected: extract `place.geometry.location.lat()` and `.lng()`
- Call `getScore(lat, lng, place.formatted_address)` from api.js
- Show loading state while API call is in progress
- Load Google Maps script using `@react-google-maps/api` LoadScript component
- API key from `process.env.REACT_APP_GOOGLE_MAPS_API_KEY`

### ScoreGauge.jsx
- SVG circular progress ring, 200px diameter
- Animate from 0 to score value on mount using CSS animation or requestAnimationFrame
- Score number in center: large bold font, color matches score band
- "NeighbourScore" label below number in small gray text
- Ring color matches score band (green/amber/red)

### DimensionCard.jsx
Props: `{ dimensionKey, name, score, weight, narrative, icon }`
- Left colored border (4px) matching score band color
- Icon + name in header row, score badge on right
- Score badge: rounded pill, colored background matching band
- Narrative text: small gray text below header
- Weight label: tiny text, bottom right, muted color
- Hover: subtle lift effect (translateY -2px, shadow increase)

### ReportCard.jsx
Props: `{ data }` — full API response object
- Locality name as page heading
- ScoreGauge centered below heading
- "Overall NeighbourScore" label
- Grid of 8 DimensionCards: 2 columns on desktop, 1 column on mobile
- Dimension icons:
  - air_quality → 🌬️
  - school_quality → 🏫
  - flood_risk → 🌊
  - healthcare → 🏥
  - crime_safety → 🛡️
  - transport → 🚌
  - property_value → 📈
  - greenery → 🌳

### MapView.jsx
- Google Map centered on searched lat/lng
- Height 300px, full width, rounded-2xl corners
- Single marker at searched location
- Map style: slightly desaturated (use Google Maps styling JSON)
- Use `@react-google-maps/api` GoogleMap + Marker components

### CompareMode.jsx
- Appears as a button "Compare with another locality" below the first ReportCard
- On click: shows second SearchBar
- Layout: two columns side by side (stacks on mobile)
- For each dimension: highlight the winning locality with a subtle green-tinted background
- Banner at top: "{locality1} scores {score1} vs {locality2} scores {score2} — {winner} wins on {top_dimension}"
- Winner determined by higher composite score

### api.js
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function getScore(lat, lng, locality_name) {
  const response = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, locality_name })
  });
  if (!response.ok) throw new Error('Score API failed');
  return response.json();
}
```

---

## KNOWN LIMITATIONS (document these in README, be prepared for judges)

1. **Crime data is district-level only** — Wakad and Baner both show the same crime score because NCRB only publishes Pune district data, not ward-level. This is disclosed in the UI.
2. **Property data is hardcoded** — only Pune localities, updated manually. Real-time scraping would need a paid API.
3. **Demo city is Pune only** — the architecture supports all of India (CPCB, Google Maps, NDMA data is national), but NCRB parsing and GTFS data is done for Maharashtra only.
4. **CPCB stations are city-level** — AQI score reflects nearest monitoring station, not hyperlocal air quality.

---

## HACKATHON EVALUATION ALIGNMENT

| Criterion | Weight | How NeighbourScore wins |
|---|---|---|
| Technical Merit | 40% | Multi-API pipeline, geospatial processing, Firebase, Gemini AI — genuinely complex backend |
| Cause Alignment | 25% | Fits PS5 Smart Resource Allocation — intelligently allocating housing decisions using verified data |
| Innovation | 25% | No direct Indian competitor. First to aggregate CPCB + NDMA + CBSE + NCRB into one neighborhood score |
| User Experience | 10% | Clean report card, compare mode, map integration, mobile responsive |

---

## SUBMISSION CHECKLIST (due April 24, 2026)

- [ ] Live Firebase Hosting URL where judges can use the app
- [ ] Public GitHub repository with detailed README
- [ ] Problem statement document
- [ ] Solution overview document
- [ ] Project deck (slides)
- [ ] Demo video: 2 minutes max — search Wakad, show report card, use compare mode with Baner, end on compare screen

**Demo video tip:** Search "Wakad" first, then compare with "Baner". Show the AI narratives appearing. End on the compare screen showing Baner winning on schools. This is the most visually compelling sequence.

---

## DEVELOPMENT PHASES

### Phase 1 — Data Prep (data-prep/ folder)
Scripts already generated. Run in this order:
1. `python ingest_crime.py --manual --cred ../firebase-adminsdk.json`
2. Download CBSE CSV from Kaggle → `python ingest_schools.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json`
3. Download NDMA shapefile from data.gov.in → `python ingest_flood.py --shp flood.shp --cred ../firebase-adminsdk.json`

### Phase 2 — Backend (backend/ folder)
1. `npm install express firebase-admin axios dotenv cors ngeohash @turf/turf @google/generative-ai`
2. Build index.js → firebase.js → all 8 services → routes/score.js
3. Test: `curl -X POST http://localhost:3000/api/score -H "Content-Type: application/json" -d "{\"lat\":18.5204,\"lng\":73.8567,\"locality_name\":\"Pune\"}"`
4. Expected: JSON with composite score and 8 dimensions with narratives

### Phase 3 — Frontend (frontend/ folder)
1. `npx create-react-app .`
2. `npm install axios @react-google-maps/api tailwindcss postcss autoprefixer`
3. `npx tailwindcss init -p`
4. Build components in order: SearchBar → ScoreGauge → DimensionCard → ReportCard → MapView → CompareMode → App.js
5. Test: search "Wakad" → verify report card renders with all 8 dimensions

### Phase 4 — Deployment
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` — point to frontend/build
4. `cd frontend && npm run build`
5. `firebase deploy`

---

## IMPORTANT RULES FOR ALL CODE IN THIS PROJECT

1. Never hardcode API keys — always use process.env
2. Every backend service must have try/catch with fallback score
3. Never commit .env or firebase-adminsdk.json — both are in .gitignore
4. Frontend must render gracefully even if one dimension fails
5. All Firebase queries must handle empty snapshots without crashing
6. Keep the backend stateless — no in-memory caching between requests (use Firestore)
7. The composite score must always be a whole number (use Math.round)
8. All scores must be clamped between 0 and 100
9. The Gemini narrative must always have a fallback string if the API call fails
10. Mobile responsiveness is required — judges may test on phone
