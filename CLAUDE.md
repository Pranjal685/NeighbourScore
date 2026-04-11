# CLAUDE.md — NeighbourScore
## AI Neighborhood Intelligence Platform
### Google Solution Challenge 2026 | Hack2Skill | Open Innovation Track (PS5)
### Prize Pool: ₹10,00,000 | Deadline: April 24, 2026
### Today's Date: April 12, 2026 | Days Remaining: 12

---

## CURRENT BUILD STATUS

### ✅ COMPLETED
- Phase 1 — Data Prep
  - Task A: CBSE schools CSV ingested to Firestore (schools collection, geohash indexed)
  - Task B: Flood zones hardcoded with real Pune coordinates (flood_zones collection)
  - Task C: NCRB crime data ingested for all 35 Maharashtra districts (crime_data collection)
  - Firestore indexes created for schools (geohash6) and flood_zones (bbox)

- Phase 2 — Backend
  - Node.js + Express server running on port 3000
  - POST /api/score endpoint working end to end
  - All 8 scoring services implemented:
    - aqi.js (CPCB API + locality fallback)
    - schools.js (Firestore geohash radius query)
    - flood.js (Turf.js point-in-polygon)
    - healthcare.js (Google Maps Places + locality fallback)
    - crime.js (Firestore district lookup)
    - transport.js (Google Maps Places + locality fallback)
    - greenery.js (Google Maps Places + locality fallback)
    - property.js (hardcoded Pune locality map)
  - gemini.js (Gemini 1.5 Flash narrative generation)
  - Score caching in Firestore (score_cache collection)
  - Profile-based weight system (general/family/professional/retiree/investor)
  - Crime scores fixed — Pune district now scores 62 (realistic)

- Phase 3 — Frontend
  - React + Tailwind + Framer Motion
  - Landing page with 5 sections:
    - Hero with two-column layout + static Baner preview card
    - Problem section (3 cards)
    - How it works (3 steps)
    - Data sources (6 cards)
    - Final CTA
  - Profile selector (4 options: Family/Professional/Retiree/Investor)
  - Loading screen with animated dimension rows
  - Report card with radar chart, score gauge, 3-tier dimension layout
  - Dark Google Map with custom styling
  - Compare mode (side by side, winner banner)
  - Framer Motion animations throughout
  - Google Places Autocomplete (Pune region)
  - Color palette: deep slate (#0D1117) + warm amber (#E6A817) + green (#3FB950)
  - Font: Instrument Serif (display) + Inter (body)

- GitHub: https://github.com/Pranjal685/NeighbourScore
  - 2 commits pushed, authored as Pranjal685

### ⚠️ KNOWN ISSUES TO FIX
- Google Places API (healthcare/transport/greenery) using fallback scores
  because billing prepayment (₹1000) is pending
  → Will fix when billing clears, fallback scores are realistic for now
- CPCB API key not yet added to .env (using locality-based AQI fallback)
  → Get free key from data.gov.in — register and copy from profile
- Gemini API hitting rate limits occasionally (free tier daily quota)
  → Fallback narratives working correctly
- Layout width still slightly narrow on some sections
  → In progress

### ❌ NOT YET DONE
- Stress testing (automated test suite)
- Security audit (API validation, rate limiting, CORS, Firebase rules)
- API call optimization (caching audit, redundant calls)
- Deployment to Firebase Hosting
- Backend deployment to Railway
- GitHub README (detailed, with screenshots)
- Demo video (2 min max, Wakad → compare Baner)
- Project deck (slides for submission)
- Submission on Hack2Skill portal

---

## TOMORROW'S PRIORITY ORDER

### Priority 1 — Stress Testing (automated)
Location: tests/ folder in project root
Tools: Jest + Axios
Run: npm test from project root

Tests to write:
  tests/stress.test.js
    - 50 concurrent POST /api/score requests
    - All 5 localities: Wakad, Baner, Koregaon Park, Hinjewadi, Kothrud
    - Response time assertions (p95 under 10 seconds)
    - All 8 dimensions present in every response
    - No score is 0 or undefined
    - Composite always between 20 and 100

  tests/scoring.test.js
    - Koregaon Park composite > Dhanori composite
    - Baner composite > Wakad composite
    - Family profile school_quality weight = 0.35
    - Professional profile transport weight = 0.25
    - All 4 profiles produce different composites for same locality
    - No dimension score ever equals 0

  tests/api.test.js
    - POST /api/score with missing lat returns 400
    - POST /api/score with missing lng returns 400
    - POST /api/score with invalid locality still returns valid response
    - GET /health returns { status: 'ok' }
    - POST /api/score with extremely long locality_name is handled safely

### Priority 2 — Security Audit
Check and fix:
  - Input validation on POST /api/score
    locality_name must be sanitized (max 100 chars, no script tags)
    lat must be a valid number between 6.5 and 37.5 (India bbox)
    lng must be a valid number between 68.0 and 97.5 (India bbox)
    profile must be one of: general/family/professional/retiree/investor

  - Rate limiting
    Install express-rate-limit
    Limit: 20 requests per IP per minute on /api/score
    Return 429 with message if exceeded

  - CORS configuration
    Currently using cors() with no origin restriction
    For production: restrict to Firebase Hosting domain
    For now: add a comment explaining this needs updating post-deploy

  - Firebase Firestore rules
    Currently likely in test mode (open read/write)
    Go to Firebase Console → Firestore → Rules
    Update rules to allow reads but deny writes from client:
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read: if true;
          allow write: if false;
        }
      }
    }

  - Check .gitignore
    Verify .env is in .gitignore
    Verify firebase-adminsdk.json is in .gitignore
    Verify no API keys appear anywhere in committed code

  - Check .env.example exists with placeholder values:
    GOOGLE_MAPS_API_KEY=your_key_here
    GEMINI_API_KEY=your_key_here
    FIREBASE_PROJECT_ID=your_project_id
    PORT=3000
    CPCB_API_KEY=your_key_here

### Priority 3 — API Call Optimization
  - Add 24-hour cache check at start of /api/score route
    If cache hit: return cached result immediately (skip all 8 API calls)
    If cache miss: run full pipeline and cache result
  - Verify Promise.allSettled is being used (not Promise.all)
  - Log response times per service to identify slowest dimension
  - If any service takes > 5 seconds: add a 5-second timeout with fallback

### Priority 4 — Deployment
  Backend → Railway:
    Go to railway.app → New project → Deploy from GitHub
    Root directory: backend/
    Add all env variables from .env
    Copy the generated Railway URL

  Frontend → Firebase Hosting:
    Update frontend/.env: REACT_APP_API_URL=<Railway URL>
    cd frontend && npm run build
    firebase deploy --only hosting
    Live URL: https://neighbourscore-492917.web.app

### Priority 5 — GitHub README
  Must include:
  - Project description (1 paragraph)
  - Live demo URL
  - Problem statement
  - Solution overview
  - Tech stack table
  - 8 dimensions table with data sources
  - Setup instructions (for judges to run locally)
  - Screenshots (landing page + report card + compare mode)
  - Team members
  - Hackathon track and submission info

### Priority 6 — Demo Video (April 22-23)
  Script:
  0:00-0:20  Problem intro — "Indian families make ₹1 crore decisions with zero data"
  0:20-0:40  Show landing page — scroll through 5 sections
  0:40-1:00  Search "Wakad" — show loading screen with 8 dimensions fetching
  1:00-1:20  Show report card — scroll through all sections, highlight AI narratives
  1:20-1:40  Click Compare → search "Baner" — show winner banner
  1:40-2:00  Show profile selector — switch to Family profile, show school weight change

  Tool: Loom (free) or OBS Studio
  Resolution: 1920x1080
  Max length: 2 minutes

### Priority 7 — Project Deck (April 22-23)
  Slides needed:
  1. Cover — NeighbourScore logo + tagline
  2. Problem — the ₹1 crore decision with zero data
  3. Solution — 8-dimension AI report card
  4. How it works — 3 steps
  5. Tech architecture — stack diagram
  6. Data sources — 6 verified government sources
  7. Demo screenshot — report card for Wakad
  8. Google Solution Challenge alignment — PS5 Smart Resource Allocation
  9. Team — names and roles
  10. Live URL + GitHub link

---

## ENVIRONMENT VARIABLES REFERENCE

Root .env (never commit):
  GOOGLE_MAPS_API_KEY=<set>
  GEMINI_API_KEY=<set>
  FIREBASE_PROJECT_ID=neighbourscore-492917
  PORT=3000
  CPCB_API_KEY=<not yet set — get from data.gov.in>

frontend/.env (never commit):
  REACT_APP_GOOGLE_MAPS_API_KEY=<same as above>
  REACT_APP_API_URL=http://localhost:3000 (update to Railway URL after deploy)

---

## FIREBASE PROJECT

Project ID: neighbourscore-492917
Project name: NeighbourScore
Firestore region: asia-south1 (Mumbai)
Firestore collections:
  schools       — CBSE schools with geohash indexing
  flood_zones   — NDMA flood polygon data (5 Pune zones hardcoded)
  crime_data    — NCRB 2023 district level (35 Maharashtra districts)
  score_cache   — Cached API responses (24hr TTL)

---

## GITHUB REPOSITORY

URL: https://github.com/Pranjal685/NeighbourScore
Branch: main
Commits: 3 (initial + phase 1&2 + phase 3)
Status: Public

---

## HACKATHON SUBMISSION REQUIREMENTS

Platform: Hack2Skill
Track: Open Innovation (PS5 alignment)
Deadline: April 24, 2026

Required deliverables:
  ✅ Problem statement (use Section 2 of Build Guide)
  ✅ Solution overview (use Section 5 of Build Guide)
  ❌ Prototype link (need Firebase Hosting URL)
  ❌ Project deck (need to create)
  ❌ GitHub repository with README (repo exists, README needs work)
  ❌ Demo video (2 min max)

Demo localities for video:
  Primary search: Wakad, Pune (lat: 18.5974, lng: 73.7898)
  Compare with: Baner, Pune (lat: 18.5590, lng: 73.7868)
  Expected: Baner wins on Air Quality and Healthcare
  Profile to demo: Family (school weight goes to 35%)

---

## TECH STACK SUMMARY

Frontend:  React + Tailwind CSS + Framer Motion + Recharts
Backend:   Node.js + Express
Database:  Firebase Firestore
Maps:      Google Maps JavaScript API + Places API + Geocoding API
AI:        Gemini 1.5 Flash (narrative generation)
Geospatial: ngeohash (radius queries) + @turf/turf (point-in-polygon)
Hosting:   Firebase Hosting (frontend) + Railway (backend)
