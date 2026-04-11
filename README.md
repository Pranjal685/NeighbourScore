# NeighbourScore

> **AI-powered neighborhood intelligence for Indian homebuyers.**  
> Score any Pune locality across 8 data-driven dimensions and receive a composite livability score with Gemini AI narratives — built entirely on verified government and public data.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0--flash-purple)](https://ai.google.dev)
[![Google Solution Challenge](https://img.shields.io/badge/Google-Solution%20Challenge%202026-4285F4)](https://developers.google.com/community/gdsc-solution-challenge)

---

## What is NeighbourScore?

Buying or renting a home is one of the biggest decisions of your life — yet most people rely on broker opinions and unstructured reviews. NeighbourScore changes that.

Type any locality name in Pune. Get an objective **report card** across 8 dimensions — CPCB air quality, CBSE school counts, NDMA flood zones, NCRB crime rates, hospital density, transport access, greenery, and property trends — with a single composite score and plain-English AI summaries for each dimension.

**Ranked #1 Real Estate tool on Razorpay Fix My Itch · 94.5/100 · Validated by 50,000+ Indians.**

---

## The 8 Scoring Dimensions

| # | Dimension | Default Weight | Data Source |
|---|---|---|---|
| 1 | School Quality | 20% | CBSE Affiliation Database (geohash proximity) |
| 2 | Air Quality | 15% | CPCB Real-time AQI API |
| 3 | Flood Risk | 15% | NDMA flood hazard polygons (Firestore) |
| 4 | Healthcare | 15% | Google Maps Places API |
| 5 | Crime Safety | 15% | NCRB 2023 district data (Firestore) |
| 6 | Transport | 10% | Google Maps Places API |
| 7 | Property Value | 5% | Aggregated 2024 Pune price data |
| 8 | Greenery | 5% | Google Maps Places API |

Composite score = weighted sum clamped to 0–100. Weights shift based on the user's **profile** (see below).

---

## User Profile Personalisation

Before searching, users select a profile. The composite score is re-weighted to reflect what matters most to that person. Individual dimension scores never change — only the weights.

| Profile | Key reweighting |
|---|---|
| **Family** | Schools 35%, Crime 20%, Air 15% |
| **Professional** | Transport 25%, Property 15%, Air 15% |
| **Retiree** | Healthcare 30%, Crime 20%, Greenery 15% |
| **Investor** | Property 35%, Transport 20%, Schools 15% |
| **General** | Default weights as above |

The active profile is included in the API response (`profile`, `weights_used`) and shown as a pill on the report card. Gemini narratives are also tailored to the profile persona.

---

## Project Structure

```
NeighbourScore/
├── backend/
│   ├── index.js              # Express entry point — CORS, routes, /health
│   ├── firebase.js           # Firebase Admin SDK initialisation
│   ├── routes/
│   │   └── score.js          # POST /api/score · GET /api/score/:locality
│   ├── services/
│   │   ├── aqi.js            # CPCB AQI — nearest station by haversine distance
│   │   ├── schools.js        # Geohash-5 Firestore proximity query + haversine filter
│   │   ├── flood.js          # Turf.js point-in-polygon against Firestore flood_zones
│   │   ├── healthcare.js     # Google Places nearbysearch — hospitals 3km
│   │   ├── crime.js          # Google Geocoding → district slug → Firestore crime_data
│   │   ├── transport.js      # Google Places — bus stops 500m
│   │   ├── greenery.js       # Google Places — parks 1km
│   │   ├── property.js       # Hardcoded Pune locality price/trend map
│   │   └── gemini.js         # Gemini 2.0 Flash — profile-aware AI narratives
│   └── scripts/
│       └── fix_crime_scores.js  # One-time Firestore crime score backfill utility
├── data-prep/
│   ├── ingest_crime.py       # NCRB 2023 Maharashtra → Firestore crime_data
│   ├── ingest_flood.py       # NDMA flood polygons → Firestore flood_zones
│   ├── ingest_schools.py     # CBSE CSV → Firestore schools (with geohash)
│   └── verify_firestore.py   # Verify all collections are populated
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js                  # State machine: search → loading → results
│       ├── index.css               # Design tokens, layout grid classes, breakpoints
│       ├── components/
│       │   ├── SearchBar.jsx       # Google Places Autocomplete (Pune-restricted)
│       │   ├── ProfileSelector.jsx # 4-profile card selector
│       │   ├── ScoreGauge.jsx      # SVG animated circular progress ring
│       │   ├── DimensionCard.jsx   # Tier 1/2/3 cards with score, bar, narrative
│       │   ├── DimensionGrid.jsx   # 3-tier responsive grid of dimension cards
│       │   ├── RadarChart.jsx      # Recharts radar — single or overlay compare
│       │   ├── MapView.jsx         # Google Maps — location marker, dark style
│       │   ├── CompareMode.jsx     # Second locality search + side-by-side comparison
│       │   └── Navbar.jsx          # Sticky report navbar with breadcrumb + share
│       ├── pages/
│       │   ├── LandingPage.jsx     # Hero, problem, how-it-works, data sources, CTA
│       │   ├── ReportPage.jsx      # Full report: score hero, dimensions, map, compare
│       │   └── LoadingScreen.jsx   # Animated loading state during API call
│       ├── hooks/
│       │   └── useCountUp.js       # Number animation hook for score display
│       └── services/
│           └── api.js              # getScore(lat, lng, locality_name, profile)
├── CLAUDE.md                 # Full project spec and architecture reference
├── .env.example              # Required environment variable template
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ (data ingestion only)
- Firebase project with Firestore (Native mode, region `asia-south1`)
- Google Cloud project with Maps JavaScript API + Places API + Geocoding API enabled
- Gemini API key — free at [ai.google.dev](https://ai.google.dev)
- CPCB API key — free at [data.gov.in](https://data.gov.in) (register and copy from your profile)

### 1. Clone

```bash
git clone https://github.com/Pranjal6955/NeighbourScore.git
cd NeighbourScore
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in your API keys
```

Root `.env`:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
GEMINI_API_KEY=your_gemini_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CPCB_API_KEY=your_cpcb_key
PORT=3000
```

Frontend `frontend/.env`:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=same_as_above
REACT_APP_API_URL=http://localhost:3000
```

### 3. Firebase setup

1. Create a Firebase project → enable **Cloud Firestore** in Native mode
2. Download the service account JSON → save as `firebase-adminsdk.json` in the project root (never committed)
3. Create these Firestore composite indexes:

| Collection | Field 1 | Field 2 |
|---|---|---|
| `schools` | `geohash5` ASC | — |
| `flood_zones` | `bbox.maxLat` ASC | `bbox.minLat` ASC |

### 4. Data ingestion (run once)

```bash
cd data-prep
pip install firebase-admin pandas geohash2 tqdm geopandas shapely

# Crime data (hardcoded NCRB 2023 Maharashtra — no download needed)
python ingest_crime.py --manual --cred ../firebase-adminsdk.json

# Flood zones (hardcoded Pune river polygons — no shapefile needed)
python ingest_flood.py --manual --cred ../firebase-adminsdk.json

# CBSE schools — download CSV first:
# https://www.kaggle.com/datasets/imtkaggleteam/cbse-affiliated-schools-data
python ingest_schools.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json

# Verify all collections
python verify_firestore.py
```

### 5. Start the backend

```bash
cd backend
npm install
node index.js
# → NeighbourScore backend running on port 3000
```

Verify:
```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}

curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"lat":18.5204,"lng":73.8567,"locality_name":"Wakad, Pune","profile":"family"}'
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3001
```

---

## API Reference

### `POST /api/score`

**Request:**
```json
{
  "lat": 18.5974,
  "lng": 73.7898,
  "locality_name": "Wakad, Pune",
  "profile": "family"
}
```

`profile` is optional (defaults to `"general"`). Valid values: `general` · `family` · `professional` · `retiree` · `investor`.

**Response:**
```json
{
  "locality": "Wakad, Pune",
  "composite": 76,
  "profile": "family",
  "weights_used": {
    "air_quality": 0.15,
    "school_quality": 0.35,
    "flood_risk": 0.10,
    "healthcare": 0.10,
    "crime_safety": 0.20,
    "transport": 0.05,
    "property_value": 0.02,
    "greenery": 0.03
  },
  "cached": false,
  "timestamp": "2026-04-12T00:00:00.000Z",
  "dimensions": {
    "school_quality": {
      "score": 70,
      "weight": "35%",
      "raw": { "count": 7 },
      "narrative": "Wakad has 7 CBSE schools within 3km — strong coverage for a family with school-going children..."
    }
  }
}
```

### `GET /health`
```json
{ "status": "ok", "timestamp": "..." }
```

### `GET /api/score/:locality`

Returns a cached result (within 24h) or `404`. Cache keys are profile-scoped: `wakad_pune` for general, `wakad_pune_family` for family profile.

---

## Architecture

```
Browser
  │
  ├── LandingPage  →  ProfileSelector + SearchBar
  │                   selectedProfile state → passed to getScore()
  │
  ├── App.js  →  search | loading | results state machine
  │              getScore(lat, lng, name, profile) → POST /api/score
  │
  └── ReportPage  →  ScoreGauge · profile pill · DimensionGrid
                     RadarChart · MapView (full-bleed) · CompareMode

Backend  POST /api/score
  │
  ├── getWeights(profile)  →  weight map (5 profiles)
  ├── Promise.allSettled([8 services])  ←  all run in parallel
  │     aqi.js        CPCB API → haversine nearest station
  │     schools.js    Firestore geohash5 → haversine ≤3km
  │     flood.js      Firestore bbox → turf point-in-polygon
  │     healthcare.js Google Places hospitals 3km
  │     crime.js      Google Geocoding → Firestore crime_data
  │     transport.js  Google Places bus_station 500m
  │     greenery.js   Google Places park 1km
  │     property.js   Hardcoded Pune price map
  ├── composite = Σ(score × weight), rounded, clamped 0–100
  ├── generateNarratives(dimensions, locality, profile)  →  Gemini 2.0 Flash
  └── Cache to Firestore score_cache (profile-scoped key, 24h TTL)
```

**Key design decisions:**

- `Promise.allSettled` — a failing service never crashes the endpoint; each service has its own `try/catch` with a pre-defined fallback score
- Profile weights affect only the composite — all individual dimension scores are identical across profiles, ensuring the underlying data is consistent
- Gemini narratives are profile-aware via a tailored system prompt; fallback narratives also reference the profile persona
- Firestore cache keys are profile-scoped to avoid serving a general-profile cached score to a family-profile request
- Layout uses a single `.section-inner` centering wrapper (`max-width: 1400px`, `padding: 0 40px`); all grid classes inherit full width with no own `max-width` — prevents double-constraining at wide viewports

---

## Frontend Design System

| Token | Value |
|---|---|
| Page background | `#0D1117` |
| Card surface | `#161B22` |
| Elevated surface | `#1C2330` |
| Accent (amber) | `#E6A817` |
| Score excellent | `#3FB950` |
| Score moderate | `#E6A817` |
| Score poor | `#F85149` |
| Font — heading | Fraunces (serif) |
| Font — body | DM Sans |

Responsive breakpoints: 1024px (tablet — padding 0 24px) · 768px (mobile — padding 0 16px · single-column grids).

---

## Known Limitations

1. **Crime data is district-level** — all Pune localities share the same district score (NCRB does not publish ward-level data). Disclosed in the UI.
2. **Property data is hardcoded** — covers major Pune localities, updated manually.
3. **AQI is station-level** — reflects the nearest CPCB monitoring station, not hyperlocal air quality.
4. **Demo city is Pune only** — the architecture supports all of India, but data ingestion is scoped to Maharashtra.

---

## Firestore Collections

| Collection | Documents | Description |
|---|---|---|
| `crime_data` | 20 | NCRB 2023 Maharashtra district crime rates |
| `flood_zones` | 5 | Pune river flood polygons (GeoJSON stored as string) |
| `schools` | 108 | CBSE-affiliated Pune schools with geohash fields |
| `score_cache` | dynamic | Composite scores per locality + profile (24h TTL) |

---

## Development Phases

- [x] **Phase 1** — Data pipeline (NCRB crime, NDMA flood zones, CBSE schools → Firestore)
- [x] **Phase 2** — Backend API (8 scoring services + Gemini AI + Firestore caching)
- [x] **Phase 3** — React frontend (landing page, report card, compare mode, profile personalisation, full-bleed map, radar chart)
- [ ] **Phase 4** — Firebase Hosting deployment (live URL for judges)
- [ ] **Phase 5** — Additional cities (Mumbai, Bangalore)

---

## Hackathon Context

Built for **Google Solution Challenge 2026** · Hack2Skill · Open Innovation Track PS5 (Smart Resource Allocation). Prize pool ₹10,00,000. Submission deadline: April 24, 2026.

**Evaluation alignment:**

| Criterion | Weight | How NeighbourScore addresses it |
|---|---|---|
| Technical Merit | 40% | Multi-API parallel pipeline, geospatial processing, Firebase, Gemini AI, profile-aware scoring |
| Cause Alignment | 25% | PS5 — intelligently allocating housing decisions via verified government data |
| Innovation | 25% | First Indian platform to aggregate CPCB + NDMA + CBSE + NCRB into one neighbourhood score |
| User Experience | 10% | Profile personalisation, compare mode, radar chart, full-bleed map, mobile responsive |

---

## License

MIT © 2026 Pranjal Sahu
