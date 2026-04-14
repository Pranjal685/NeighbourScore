# NeighbourScore

![Tests](https://img.shields.io/badge/tests-52%2F52%20passing-brightgreen) ![APIs](https://img.shields.io/badge/live%20APIs-8%2F8-brightgreen) ![Hackathon](https://img.shields.io/badge/Google%20Solution%20Challenge-2026-blue) ![Track](https://img.shields.io/badge/Track-Open%20Innovation%20PS5-orange) ![Validated](https://img.shields.io/badge/Razorpay%20Fix%20My%20Itch-94.5%2F100-gold)

> India's first AI-powered neighborhood intelligence platform.
> Get an objective, data-backed report card for any locality
> in Pune — built from verified government data, not opinions.

---

## The Problem

Indian homebuyers make ₹1 crore decisions with zero structured data. Today, researching a neighborhood means:

- Checking air quality on a separate CPCB website
- Looking up schools individually on Google Maps
- Trying to find crime data that is not publicly accessible
- Reading fake and unverifiable reviews on 99acres or Housing.com
- Asking WhatsApp groups and hoping someone gives honest feedback

**This exact problem was scored 94.5/100 on Razorpay's Fix My Itch platform — rated by 50,000+ Indians on Severity, TAM, Whitespace, and Frequency. It is the highest-ranked Real Estate problem on the platform.**

---

## The Solution

NeighbourScore gives Indian homebuyers an 8-dimension report card for any Pune locality, calculated entirely from verified government and public data. No user reviews. No unverifiable opinions.

Think of it as a **credit score for neighborhoods.**

---

## Live Demo

🌐 **[Live App → neighbourscore.web.app](#)** *(link after deployment)*

### Demo localities to try:
- `Koregaon Park` — Premium central Pune (scores ~82/100)
- `Wakad` — Growing western suburb (scores ~65/100)
- `Hinjewadi` — IT corridor (scores ~58/100 on general profile)
- Compare `Baner` vs `Wakad` to see the compare feature

---

## Features

### Core
- **8-Dimension Report Card** — Air quality, schools, flood risk, healthcare, crime safety, transport, property value, greenery
- **AI Narratives** — Gemini 1.5 Flash generates plain English explanations for every score
- **Compare Mode** — Side-by-side comparison of two localities with winner detection

### Advanced
- **Profile Personalisation** — Reweight dimensions based on who you are:
  - 👨‍👩‍👧 Family — Schools 35%, Crime 20%
  - 💼 Professional — Transport 25%, Property 15%
  - 🧓 Retiree — Healthcare 30%, Greenery 15%
  - 🏠 Investor — Property Value 35%, Transport 20%

- **Evidence Drawer** — Click any dimension card to see the exact data behind the score (hospital names, school names, crime rates, news headlines)

- **Red Flag Alerts** — Automatic warnings when any dimension scores below 45/100

- **Nearby Alternatives** — After showing your locality's score, suggests 3 better-scoring nearby areas

- **Shareable Reports** — Every report gets a unique URL (e.g. `/report/koregaon-park-pune`) shareable on WhatsApp

---

## The 8 Scoring Dimensions

| # | Dimension | Weight | Data Source | Update Frequency |
|---|---|---|---|---|
| 1 | Air Quality | 15% | CPCB API — live AQI data | Hourly |
| 2 | School Quality | 20% | CBSE Affiliation DB — 20,367 schools | Annual |
| 3 | Flood Risk | 15% | NDMA Flood Hazard Atlas | Static |
| 4 | Healthcare | 15% | Google Maps Places API | Live |
| 5 | Crime Safety | 15% | NCRB Crime in India 2023 | Annual |
| 6 | Transport | 10% | Google Maps Places API | Live |
| 7 | Property Value | 5% | Gemini Search Grounding | Live |
| 8 | Greenery | 5% | Google Maps Places API | Live |

**Composite Score = Weighted average of all 8 dimensions**

---

## Score Leaderboard (Pune)

Based on our validated scoring across 15 Pune localities:

| Rank | Locality | Score | Tier |
|---|---|---|---|
| 1 | Koregaon Park | 80/100 | Premium |
| 2 | Kalyani Nagar | 77/100 | Premium |
| 3 | Baner | 76/100 | Premium |
| 4 | Kothrud | 75/100 | Good |
| 5 | Aundh | 73/100 | Good |
| 6 | Viman Nagar | 71/100 | Good |
| 7 | Magarpatta | 70/100 | Good |
| 8 | Kharadi | 67/100 | Good |
| 9 | Hinjewadi | 66/100 | Developing |
| 10 | Hadapsar | 64/100 | Developing |
| ... | ... | ... | ... |
| 15 | Dhanori | 50/100 | Developing |

---

## Tech Architecture

```
User Browser
│
▼
React Frontend (Firebase Hosting)
│  Google Places Autocomplete
│  Framer Motion animations
│  Recharts radar visualization
│
▼
Node.js + Express Backend (Railway)
│
├──► CPCB API ──────────── Live AQI data
├──► Google Maps Places ── Hospitals, transport, parks
├──► Google Geocoding ──── Reverse geocode for district
├──► Gemini 1.5 Flash ──── AI narratives + property search
├──► NewsAPI ────────────── Recent crime news
│
└──► Firebase Firestore
     ├── schools/        (20,367 CBSE schools, geohash indexed)
     ├── flood_zones/    (NDMA polygons, bbox indexed)
     ├── crime_data/     (NCRB 2023, 35 Maharashtra districts)
     ├── score_cache/    (24hr TTL, profile-scoped)
     └── shared_reports/ (shareable URL data)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Tailwind CSS | UI framework |
| Animations | Framer Motion | Page transitions, card animations |
| Charts | Recharts | 8-dimension radar chart |
| Maps | Google Maps JavaScript API | Location display |
| Backend | Node.js + Express | REST API server |
| Database | Firebase Firestore | Data storage and caching |
| AI | Gemini 1.5 Flash | Narrative generation |
| Geocoding | Google Maps Geocoding API | Reverse geocode for district |
| Places | Google Maps Places API | Healthcare, transport, greenery |
| Geospatial | ngeohash + @turf/turf | Radius queries + point-in-polygon |
| Testing | Jest + Axios | Automated test suite |
| Hosting | Firebase Hosting + Railway | Frontend + backend deployment |

---

## Test Coverage

```
52/52 tests passing

scoring.test.js        8/8  — Score correctness and profile weights
stress.test.js         5/5  — Concurrent requests and performance
security.test.js       8/8  — Input validation and attack vectors
hardcore_stress       31/31 — 15 locality validation, 16 head-to-head
                              matchups, profile stress, edge cases
```

### Security hardening
- India bounding box validation (rejects non-India coordinates)
- XSS prevention (HTML tag stripping)
- SQL/NoSQL injection protection
- Rate limiting (20 requests/min per IP)
- Input sanitization and length caps

### Performance
- 15 concurrent requests: completed in 17ms (cached)
- p95 response time: under 2ms (cached), under 8s (fresh)
- 24-hour Firestore caching per locality+profile combination

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+ (for data prep scripts)
- Firebase account
- Google Cloud account with billing enabled

### Environment Variables

Create `.env` in project root:
```env
GOOGLE_MAPS_API_KEY=your_key
GEMINI_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project_id
PORT=5000
CPCB_API_KEY=your_key
NEWS_API_KEY=your_key
```

Create `frontend/.env`:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
REACT_APP_API_URL=http://localhost:3000
```

### Run locally

```bash
# Backend
cd backend
npm install
node index.js

# Frontend (new terminal)
cd frontend
npm install
npm start

# Tests (new terminal)
npm test
```

### Data prep (one-time setup)

```bash
cd data-prep
pip install firebase-admin pandas geohash2 geopandas tqdm

# Crime data (fastest — no download needed)
python ingest_crime.py --manual --cred ../firebase-adminsdk.json

# Schools data (download CSV from Kaggle first)
python ingest_schools.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json

# Flood zones (hardcoded Pune zones)
python ingest_flood.py --cred ../firebase-adminsdk.json
```

---

## API Reference

### POST /api/score

Request:
```json
{
  "lat": 18.5362,
  "lng": 73.8937,
  "locality_name": "Koregaon Park, Pune",
  "profile": "family",
  "language": "en"
}
```

Profile options: `general` | `family` | `professional` | `retiree` | `investor`

Response:
```json
{
  "locality": "Koregaon Park, Pune",
  "composite": 82,
  "profile": "family",
  "slug": "koregaon-park-pune",
  "share_url": "/report/koregaon-park-pune",
  "cached": false,
  "dimensions": {
    "school_quality": {
      "score": 80,
      "weight": "35%",
      "narrative": "8 CBSE schools within 3km including DAV and KV...",
      "raw": { "count": 8, "schools": [] }
    }
  },
  "nearby_alternatives": [
    { "name": "Kalyani Nagar", "score": 84, "distance_km": 3 }
  ]
}
```

### GET /api/report/:slug

Returns cached report for a shareable URL slug.

```
GET /api/report/koregaon-park-pune
→ Returns full score response for Koregaon Park
```

### GET /health

```json
{ "status": "ok", "timestamp": "2026-04-14T..." }
```

---

## Known Limitations

| Limitation | Details |
|---|---|
| Crime data is district-level | NCRB publishes Pune district data only — Wakad and Baner show the same crime score |
| Property data | Gemini search grounding for live prices — accuracy varies |
| Demo city only | Currently Pune only — architecture supports all India |
| AQI station distance | Nearest CPCB station may be 2-8km away — not hyperlocal |

---

## Hackathon Alignment

**Google Solution Challenge 2026 — Open Innovation Track**
**PS5: Smart Resource Allocation**

NeighbourScore aligns with PS5 by intelligently allocating housing decision resources — helping Indian families make data-backed decisions about where to live using verified government data that was previously inaccessible in a unified format.

| Judging Criterion | Weight | How We Score |
|---|---|---|
| Technical Merit | 40% | 8 live APIs, geospatial queries, Gemini AI, 52 tests |
| Cause Alignment | 25% | PS5 Smart Resource Allocation — housing data for 1.4B Indians |
| Innovation | 25% | No Indian competitor — first to aggregate CPCB+NDMA+CBSE+NCRB |
| User Experience | 10% | Glassmorphism UI, compare mode, profile personalisation |

---

## Team

| Name | Role |
|---|---|
| Pranjal Sahu | Full Stack Development, Data Engineering |
| [Teammate Name] | [Role] |

---

## Repository Structure

```
NeighbourScore/
├── backend/
│   ├── index.js              — Express server, rate limiting
│   ├── firebase.js           — Firestore initialization
│   ├── routes/
│   │   └── score.js          — POST /api/score, GET /api/report/:slug
│   └── services/
│       ├── aqi.js            — CPCB air quality
│       ├── schools.js        — CBSE geohash radius query
│       ├── flood.js          — NDMA point-in-polygon
│       ├── healthcare.js     — Google Maps hospitals
│       ├── crime.js          — NCRB district lookup
│       ├── transport.js      — Google Maps transit stations
│       ├── greenery.js       — Google Maps parks
│       ├── property.js       — Gemini search grounding
│       ├── gemini.js         — AI narrative generation
│       ├── newsService.js    — NewsAPI crime headlines
│       └── alternatives.js   — Nearby better localities
├── frontend/
│   └── src/
│       ├── pages/            — LandingPage, ReportPage, LoadingScreen
│       ├── components/       — 15 React components
│       └── services/         — API client
├── data-prep/
│   ├── ingest_schools.py     — CBSE CSV → Firestore
│   ├── ingest_flood.py       — NDMA shapefiles → Firestore
│   └── ingest_crime.py       — NCRB data → Firestore
├── tests/
│   ├── scoring.test.js       — Score correctness
│   ├── stress.test.js        — Performance
│   ├── security.test.js      — Attack vectors
│   └── hardcore_stress.test.js — Full validation suite
├── CLAUDE.md                 — AI context file
└── README.md                 — This file
```

---

*Built for Google Solution Challenge 2026 — Hack2Skill Open Innovation Track | Prize Pool ₹10,00,000*
*Demo city: Pune, Maharashtra, India*
