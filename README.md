# NeighbourScore

![Tests](https://img.shields.io/badge/tests-52%2F52%20passing-brightgreen)
![APIs](https://img.shields.io/badge/live%20APIs-8%2F8-brightgreen)
![Build](https://img.shields.io/badge/build-clean%20257kb-brightgreen)
![Hackathon](https://img.shields.io/badge/Google%20Solution%20Challenge-2026-blue)
![Track](https://img.shields.io/badge/Track-Open%20Innovation-orange)
![Validated](https://img.shields.io/badge/Razorpay%20Fix%20My%20Itch-94.5%2F100-gold)

> **India's first AI-powered neighborhood intelligence platform.**
> Get an objective, data-backed report card for any locality in Pune —
> built entirely from verified government data. No opinions. No reviews. Just facts.

---

## The Problem

Indian homebuyers make ₹1 crore decisions with zero structured data.

Today, researching a new locality means:
- Checking air quality on a separate CPCB website
- Looking up schools one by one on Google Maps
- Trying to find crime data that is not publicly accessible in any useful form
- Reading unverifiable reviews on 99acres or Housing.com
- Asking WhatsApp groups and hoping someone gives honest feedback

**This problem was scored 94.5/100 on Razorpay's Fix My Itch platform — rated by 50,000+ Indians on Severity, TAM, Whitespace, and Frequency. It is the highest-ranked Real Estate problem on the platform.**

---

## The Solution

NeighbourScore gives Indian homebuyers an **8-dimension report card** for any Pune locality, calculated from verified government and public data.

**Think of it as a credit score for neighborhoods.**

---

## Live Demo

🌐 **Live App** — *(link after deployment)*

**Localities to try:**
- `Koregaon Park` — Premium central Pune (scores ~80/100)
- `Wakad` — Growing western suburb (scores ~58/100)
- `Hinjewadi` — IT corridor (scores lower on Professional profile due to poor transport)
- Compare `Baner` vs `Wakad` to see the compare feature

---

## Pune Neighborhood Heat Map

The most visually striking feature — an interactive Google Map of Pune
where every neighborhood is color-coded by its NeighbourScore.

- 🟢 **Green** (75+) — Premium: Koregaon Park, Kalyani Nagar, Baner, Aundh
- 🟡 **Amber** (55-74) — Good: Viman Nagar, Kharadi, Wakad, Hadapsar
- 🔴 **Red** (below 55) — Developing: Dhanori, Wagholi, Katraj

Click any polygon to instantly analyze that locality.
No Indian real estate platform has ever done this.

---

## The 8 Scoring Dimensions

| # | Dimension | Weight | Data Source | Frequency |
|---|---|---|---|---|
| 1 | Air Quality | 15% | CPCB API — live AQI | Hourly |
| 2 | School Quality | 20% | CBSE DB — 20,367 schools | Annual |
| 3 | Flood Risk | 15% | NDMA Flood Hazard Atlas | Static |
| 4 | Healthcare | 15% | Google Maps Places API | Live |
| 5 | Crime Safety | 15% | NCRB Crime in India 2023 | Annual |
| 6 | Transport | 10% | Google Maps Places API | Live |
| 7 | Property Value | 5% | Gemini Search Grounding | Live |
| 8 | Greenery | 5% | Google Maps Places API | Live |

**Composite Score = Weighted average of all 8 dimensions**

---

## Features

### Core Features
- **8-Dimension Report Card** — objective score from verified government data
- **AI Narratives** — Gemini 1.5 Flash generates plain English explanations
- **Pune Heat Map** — entire city color-coded by score, click to analyze
- **Compare Mode** — side-by-side comparison with winner detection

### Advanced Features
- **Profile Personalisation** — reweight dimensions based on who you are:

| Profile | Key Weights |
|---|---|
| 👨‍👩‍👧 Family | Schools 35%, Crime 20% |
| 💼 Professional | Transport 25%, Property 15% |
| 🧓 Retiree | Healthcare 30%, Greenery 15% |
| 🏠 Investor | Property Value 35%, Transport 20% |

- **Evidence Drawer** — click any dimension card to see exact data behind the score (hospital names, school names, crime rates, news headlines)
- **Red Flag Alerts** — automatic warnings when any dimension scores below 45/100
- **Nearby Alternatives** — suggests better-scoring areas nearby after showing your result
- **Shareable Reports** — every report gets a unique URL shareable on WhatsApp (`/report/koregaon-park-pune`)
- **Recent Crime News** — GNews API pulls latest Pune crime headlines into the evidence drawer

---

## Score Leaderboard (Pune — validated across 52 tests)

| Rank | Locality | Score | Tier |
|---|---|---|---|
| 1 | Koregaon Park | 80/100 | Premium |
| 2 | Kalyani Nagar | 77/100 | Premium |
| 3 | Baner | 76/100 | Premium |
| 4 | Kothrud | 75/100 | Premium |
| 5 | Aundh | 73/100 | Good |
| 6 | Viman Nagar | 71/100 | Good |
| 7 | Magarpatta | 70/100 | Good |
| 8 | Kharadi | 67/100 | Good |
| 9 | Hinjewadi | 66/100 | Developing |
| 10 | Hadapsar | 64/100 | Developing |
| 11 | Kondhwa | 61/100 | Developing |
| 12 | Katraj | 60/100 | Developing |
| 13 | Wakad | 58/100 | Developing |
| 14 | Wagholi | 55/100 | Developing |
| 15 | Dhanori | 50/100 | Developing |

---

## Architecture

```
User Browser
     │
     ▼
React Frontend (Firebase Hosting)
  • Google Places Autocomplete (Pune region)
  • Framer Motion animations (8 types)
  • Recharts RadarChart (8 dimensions)
  • Google Maps heat map + dark report map
  • Glassmorphism + Minimalism UI
     │
     ▼
Node.js + Express Backend (Railway)
     │
     ├──► CPCB API ──────────── Live AQI, Maharashtra filter
     ├──► Google Maps Places ── Hospitals, transit, parks
     ├──► Google Geocoding ──── Reverse geocode for district
     ├──► Gemini 1.5 Flash ──── AI narratives + property search
     ├──► GNews API ──────────── Recent Pune crime news (cached)
     │
     └──► Firebase Firestore
              ├── schools/         (20,367 CBSE, geohash indexed)
              ├── flood_zones/     (NDMA polygons, bbox indexed)
              ├── crime_data/      (NCRB 2023, 35 districts)
              ├── score_cache/     (24hr TTL, profile-scoped)
              └── shared_reports/  (shareable URL data)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts (RadarChart) |
| Maps | Google Maps JavaScript API |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| AI | Gemini 1.5 Flash (narratives + property search) |
| Geocoding | Google Maps Geocoding API |
| Places | Google Maps Places API |
| Geospatial | ngeohash + @turf/turf |
| News | GNews API (Pune crime headlines) |
| Security | express-rate-limit + input validation |
| Testing | Jest + Axios |
| Hosting | Firebase Hosting + Railway |

---

## Test Coverage — 52/52 Passing

```
scoring.test.js         8/8   Score correctness + profile weights
stress.test.js          5/5   Concurrent requests + performance
security.test.js        8/8   Input validation + attack vectors
hardcore_stress.test.js 31/31 15 locality validation, 16 head-to-head
                               matchups, profile stress, edge cases
```

### Security Hardening
- India bounding box validation (rejects non-India coordinates)
- XSS prevention (HTML tag stripping)
- SQL/NoSQL injection protection
- Rate limiting (20 requests/min per IP via express-rate-limit)
- Input sanitization (max 100 chars, special char removal)
- Profile allowlist (invalid profiles fallback to general)

### Performance
- 15 concurrent requests completed in 17ms (cached)
- p95 response time under 2ms (cached), under 8s (fresh)
- 24-hour Firestore caching per locality + profile combination
- GNews 10-minute cache with retry logic for rate limits
- Frontend build: 257kb gzipped

---

## Hackathon Alignment

**Google Solution Challenge 2026 — Hack2Skill — Open Innovation Track**

| Judging Criterion | Weight | How NeighbourScore Scores |
|---|---|---|
| Technical Merit | 40% | 8 live APIs, geospatial queries, Gemini AI, 52 tests, security hardening, rate limiting |
| Innovation & Creativity | 25% | No Indian competitor — first to aggregate CPCB+NDMA+CBSE+NCRB. Heat map never done before in India. |
| Alignment With Cause | 25% | PS5 Smart Resource Allocation. 94.5/100 validated by 50,000+ Indians. ₹1 crore housing decisions with zero data. |
| User Experience | 10% | Glassmorphism UI, 8 animations, compare mode, profile personalisation, mobile responsive |

**Mandate compliance:**
- ✅ Cloud deployed (Firebase Hosting + Railway)
- ✅ Uses Google AI (Gemini 1.5 Flash for narratives and property search)

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+ (data prep only)
- Firebase account
- Google Cloud account with billing

### Environment Variables

Root `.env`:
```
GOOGLE_MAPS_API_KEY=your_key
GEMINI_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project_id
PORT=5000
CPCB_API_KEY=your_key
NEWS_API_KEY=your_gnews_key
```

`frontend/.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
REACT_APP_API_URL=http://localhost:5000
```

### Run Locally

```bash
# Backend
cd backend
npm install
node index.js

# Frontend (new terminal)
cd frontend
npm install
npm start

# Tests (new terminal, backend must be running)
npm test
```

### One-time Data Prep

```bash
cd data-prep
pip install firebase-admin pandas geohash2 tqdm

# Crime data (no download needed)
python ingest_crime.py --manual --cred ../firebase-adminsdk.json

# Schools (download CSV from Kaggle: imtkaggleteam/cbse-affiliated-schools-data)
python ingest_schools.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json

# Flood zones (hardcoded Pune polygons)
python ingest_flood.py --cred ../firebase-adminsdk.json
```

---

## API Reference

### POST /api/score

```json
{
  "lat": 18.5362,
  "lng": 73.8937,
  "locality_name": "Koregaon Park, Pune",
  "profile": "family"
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
  "weights_used": { "school_quality": 0.35, "crime_safety": 0.20, ... },
  "dimensions": {
    "school_quality": {
      "score": 80,
      "weight": "35%",
      "narrative": "8 CBSE schools within 3km...",
      "raw": {
        "count": 8,
        "schools": [...],
        "recent_news": [...]
      }
    }
  },
  "nearby_alternatives": [
    {
      "name": "Kalyani Nagar",
      "distance_km": 3,
      "why_better": "Better healthcare access and greenery"
    }
  ]
}
```

### GET /api/report/:slug
Returns cached report for a shareable URL slug.

### GET /health
```json
{ "status": "ok", "timestamp": "2026-04-15T..." }
```

---

## Known Limitations

| Limitation | Details |
|---|---|
| Crime data is district-level | NCRB publishes Pune district data only — ward-level not available publicly |
| Property data | Gemini search grounding — accuracy varies by locality |
| Demo city only | Currently Pune only — architecture supports all India |
| AQI station distance | Nearest CPCB station may be 2-8km away |
| GNews rate limit | 1 req/sec — handled by 10-min cache + retry |

---

## Repository Structure

```
NeighbourScore/
├── backend/
│   ├── index.js              — Express server, rate limiting, CORS
│   ├── firebase.js           — Firestore initialization
│   ├── routes/
│   │   └── score.js          — POST /api/score, GET /api/report/:slug
│   └── services/
│       ├── aqi.js            — CPCB air quality (Maharashtra filter)
│       ├── schools.js        — CBSE geohash radius query
│       ├── flood.js          — NDMA point-in-polygon (Turf.js)
│       ├── healthcare.js     — Google Maps hospitals
│       ├── crime.js          — NCRB district lookup
│       ├── transport.js      — Google Maps transit stations
│       ├── greenery.js       — Google Maps parks
│       ├── property.js       — Gemini search grounding
│       ├── gemini.js         — AI narrative generation
│       ├── newsService.js    — GNews API (Pune crime headlines)
│       └── alternatives.js   — Nearby better localities
├── frontend/
│   └── src/
│       ├── data/
│       │   └── pune_localities.json  — Heat map GeoJSON polygons
│       ├── pages/
│       │   ├── LandingPage.jsx       — Hero, heat map, 5 sections
│       │   ├── ReportPage.jsx        — Full report card
│       │   └── LoadingScreen.jsx     — Animated data fetch
│       ├── components/               — 16 React components
│       │   ├── HeatMap.jsx           — Pune score heat map
│       │   ├── DimensionCard.jsx     — Score card with evidence drawer
│       │   ├── EvidenceDrawer.jsx    — Raw data + news per dimension
│       │   ├── RedFlagAlert.jsx      — Warning for low scores
│       │   ├── NearbyAlternatives.jsx — Better areas nearby
│       │   ├── ShareModal.jsx        — WhatsApp shareable URL
│       │   └── ...
│       └── services/
│           └── api.js                — Backend API client
├── data-prep/
│   ├── ingest_schools.py     — CBSE CSV → Firestore
│   ├── ingest_flood.py       — Flood zones → Firestore
│   └── ingest_crime.py       — NCRB data → Firestore
├── tests/
│   ├── scoring.test.js       — Score correctness (8 tests)
│   ├── stress.test.js        — Performance (5 tests)
│   ├── security.test.js      — Security (8 tests)
│   └── hardcore_stress.test.js — Full validation (31 tests)
└── README.md
```

---

## Team

| Name | Role |
|---|---|
| Pranjal Sahu | Full Stack Development, Data Engineering, Product |
| Teammate | [Role] |

---

*Google Solution Challenge 2026 — Hack2Skill Open Innovation Track*
*Demo city: Pune, Maharashtra, India*
*Validated problem: 94.5/100 on Razorpay Fix My Itch*
