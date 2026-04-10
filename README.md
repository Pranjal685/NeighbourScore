# 🏘️ NeighbourScore

> **AI-powered neighborhood intelligence for Indian homebuyers.**  
> Score any Pune locality across 8 data-driven dimensions — crime, schools, healthcare, flood risk, air quality, transport, greenery, and property value — and get a single composite livability score with Gemini AI narratives.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://python.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 📌 What is NeighbourScore?

Buying a home is one of the biggest decisions of your life — yet most people rely on gut feel and broker opinions. NeighbourScore changes that.

Given a **latitude, longitude, and locality name**, the platform returns a structured JSON score covering:

| Dimension | Weight | Data Source |
|---|---|---|
| 🏫 School Quality | 20% | CBSE Affiliation Database (108 Pune schools) |
| 🌊 Flood Risk | 15% | Hardcoded Pune river flood polygons (GeoJSON) |
| 🌫️ Air Quality | 15% | CPCB Real-time AQI API |
| 🏥 Healthcare | 15% | Google Maps Places API / locality fallback |
| 🚔 Crime Safety | 15% | NCRB 2023 Maharashtra district data |
| 🚌 Transport | 10% | Google Maps Places API / locality fallback |
| 🏠 Property Value | 5% | Aggregated 2024 Pune price data |
| 🌳 Greenery | 5% | Google Maps Places API / locality fallback |

**Composite score** = weighted sum (0–100), powered by Gemini AI narratives for each dimension.

---

## 🗂️ Project Structure

```
NeighbourScore/
├── backend/                  # Node.js Express API server
│   ├── index.js              # Entry point — Express app + routes
│   ├── firebase.js           # Firebase Admin SDK init
│   ├── routes/
│   │   └── score.js          # POST /api/score, GET /api/score/:locality
│   └── services/
│       ├── aqi.js            # CPCB AQI score
│       ├── schools.js        # Geohash-based CBSE school proximity
│       ├── flood.js          # Turf.js point-in-polygon flood check
│       ├── healthcare.js     # Hospital density score
│       ├── crime.js          # NCRB district crime score
│       ├── transport.js      # Bus stop density score
│       ├── greenery.js       # Park density score
│       ├── property.js       # Locality price trend score
│       └── gemini.js         # Gemini AI narrative generation
├── data-prep/                # Python data ingestion scripts
│   ├── ingest_crime.py       # NCRB 2023 → Firestore crime_data
│   ├── ingest_flood.py       # Pune flood polygons → Firestore flood_zones
│   ├── ingest_schools.py     # CBSE CSV → Firestore schools
│   └── verify_firestore.py   # Verify all collections populated
├── frontend/                 # (Phase 3 — coming soon)
├── CLAUDE.md                 # Full project context & architecture spec
└── .env.example              # Required environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Firebase project with Firestore (Native mode)
- Google Cloud project with Maps API key
- Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/NeighbourScore.git
cd NeighbourScore
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your API keys in .env
```

### 3. Set up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Firestore** in Native mode (region: `asia-south1`)
3. Download your **service account JSON** and save as `firebase-adminsdk.json` in the root
4. Create the composite indexes below

#### Required Firestore Indexes

| Collection | Field 1 | Field 2 | Scope |
|---|---|---|---|
| `schools` | `geohash5` ASC | — | Collection |
| `flood_zones` | `bbox.maxLat` ASC | `bbox.minLat` ASC | Collection |

### 4. Run data ingestion (Phase 1)

```bash
cd data-prep
pip install firebase-admin pandas geohash2 tqdm geopandas shapely

# Ingest NCRB crime data (hardcoded — no download needed)
python ingest_crime.py --manual --cred ../firebase-adminsdk.json

# Ingest Pune flood zones (hardcoded polygons — no shapefile needed)
python ingest_flood.py --manual --cred ../firebase-adminsdk.json

# Ingest CBSE schools (download CSV from Kaggle first)
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

---

## 📡 API Reference

### `POST /api/score`

Run the full scoring pipeline for a location.

**Request body:**
```json
{
  "lat": 18.5974,
  "lng": 73.7898,
  "locality_name": "Wakad, Pune"
}
```

**Response:**
```json
{
  "locality": "Wakad, Pune",
  "composite": 58,
  "cached": false,
  "timestamp": "2026-04-11T01:48:12.280Z",
  "dimensions": {
    "school_quality": {
      "score": 70,
      "weight": "20%",
      "raw": { "count": 7, "schools": [...] },
      "narrative": "Wakad has 7 CBSE-affiliated schools within 3km..."
    },
    "healthcare": {
      "score": 65,
      "weight": "15%",
      "raw": { "count": 5, "source": "fallback", "locality_matched": "wakad" },
      "narrative": "..."
    }
    // ... 6 more dimensions
  }
}
```

### `GET /health`

```json
{ "status": "ok", "timestamp": "2026-04-11T01:48:00.000Z" }
```

### `GET /api/score/:locality`

Returns cached score if available (within 24 hours), otherwise `404`.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
GEMINI_API_KEY=your_gemini_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CPCB_API_KEY=your_cpcb_key        # Register free at data.gov.in
PORT=3000
```

---

## 🏗️ Architecture

```
Client Request
     │
     ▼
Express API (index.js)
     │
     ├── POST /api/score
     │        │
     │        ├── Promise.allSettled([8 services])
     │        │   ├── aqi.js       → CPCB API (haversine nearest station)
     │        │   ├── schools.js   → Firestore geohash5 proximity query
     │        │   ├── flood.js     → Firestore bbox filter + turf point-in-polygon
     │        │   ├── healthcare.js→ Google Places / locality fallback
     │        │   ├── crime.js     → Google Geocode + Firestore crime_data
     │        │   ├── transport.js → Google Places / locality fallback
     │        │   ├── greenery.js  → Google Places / locality fallback
     │        │   └── property.js  → Hardcoded Pune locality price map
     │        │
     │        ├── Composite score (weighted average)
     │        ├── Gemini AI narratives (gemini-2.0-flash)
     │        └── Cache to Firestore score_cache
     │
     └── GET /api/score/:locality → Check Firestore cache first
```

**Key design decisions:**
- `Promise.allSettled` — one failing API never crashes the endpoint
- Every service has its own `try/catch` with a graceful fallback score
- GeoJSON stored as JSON string in Firestore (avoids nested array limit)
- Geohash precision 5 (~5km cells) for school proximity queries
- Scores always clamped `0–100` via `Math.min(100, Math.max(0, score))`

---

## 📊 Firestore Collections

| Collection | Documents | Description |
|---|---|---|
| `crime_data` | 20 | NCRB 2023 Maharashtra districts |
| `flood_zones` | 5 | Pune river flood polygons (GeoJSON as string) |
| `schools` | 108 | CBSE-affiliated Pune schools with geohash |
| `score_cache` | dynamic | Cached composite scores (24h TTL) |

---

## 🗺️ Roadmap

- [x] **Phase 1** — Data pipeline (crime, schools, flood zones → Firestore)
- [x] **Phase 2** — Backend API (8 scoring services + Gemini narratives)
- [ ] **Phase 3** — Frontend (React/Next.js map interface)
- [ ] **Phase 4** — More cities (Mumbai, Bangalore)
- [ ] **Phase 5** — Mobile app

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss major changes.

---

## 📄 License

MIT © 2024 Pranjal Sahu
