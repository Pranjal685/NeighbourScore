# CLAUDE.md — NeighbourScore
## AI Neighborhood Intelligence Platform
### Google Solution Challenge 2026 | Hack2Skill | Open Innovation Track (PS5)
### Prize Pool: ₹10,00,000 | Deadline: April 24, 2026
### Last Updated: April 15, 2026 | Days Remaining: 9

---

## CURRENT BUILD STATUS

### ✅ COMPLETED

**Phase 1 — Data Prep**
- Task A: CBSE schools CSV ingested to Firestore (schools collection, geohash indexed)
- Task B: Flood zones hardcoded with real Pune coordinates (flood_zones collection)
- Task C: NCRB crime data ingested for all 35 Maharashtra districts (crime_data collection)
- Firestore indexes created for schools (geohash6) and flood_zones (bbox)

**Phase 2 — Backend**
- Node.js + Express server running on port 5000
- POST /api/score endpoint working end to end
- All 8 scoring services with LIVE data:
  - aqi.js — CPCB API, Maharashtra filter, nearest Pune station
  - schools.js — Firestore geohash radius query
  - flood.js — Turf.js point-in-polygon
  - healthcare.js — Google Maps Places API live
  - crime.js — Firestore district lookup
  - transport.js — Google Maps Places API transit_station
  - greenery.js — Google Maps Places API live
  - property.js — Gemini Search grounding live 2026 prices
  - gemini.js — Gemini 1.5 Flash narrative generation
  - newsService.js — GNews API Pune crime news, 10min cache, retry logic
  - alternatives.js — Nearby better localities, qualitative reasons only
- Score caching in Firestore (profile-scoped cache keys)
- Profile-based weight system (general/family/professional/retiree/investor)
- Rate limiting (20 req/min per IP)
- Input validation (India bbox, XSS, injection protection)
- Shareable URLs — GET /api/report/:slug
- shared_reports Firestore collection with view_count

**Phase 3 — Frontend**
- React + Tailwind + Framer Motion
- Design: Glassmorphism + Minimalism
- Font: Inter + DM Serif Display
- Colors: #F0F4FF base, #6366F1 indigo, #E6A817 amber, #10B981 green

Landing page (5 sections):
  - Hero two-column + static Baner preview card
  - Problem section (3 cards with icons)
  - How it works (3 steps)
  - Data sources (6 cards)
  - Final CTA with animated stats

Report card:
  - SVG animated score gauge + counter
  - Recharts RadarChart (8 dimensions)
  - 3-tier dimension layout
  - Evidence drawer per dimension
  - Red flag alerts (score < 45)
  - Nearby alternatives (qualitative reasons)
  - Dark styled Google Map
  - Compare mode
  - Scroll progress bar

Profile selector (4 options):
  Family / Professional / Retiree / Investor

Shareable URLs:
  - /report/:slug with WhatsApp share modal

Animations (8 total):
  1. Scroll-triggered number counters
  2. Score gauge ring draw + counter
  3. Staggered dimension card entrance
  4. Floating background blobs
  5. Search bar focus glow
  6. Red flag shake
  7. Nearby alternatives hover lift
  8. Scroll progress bar

Mobile responsive:
  - 320px to 1440px all breakpoints clean
  - No horizontal scroll anywhere
  - Bottom sheet evidence drawer on mobile

**Testing — 52/52 passing**
- scoring.test.js: 8/8
- stress.test.js: 5/5
- security.test.js: 8/8
- hardcore_stress.test.js: 31/31
- 16/16 head-to-head matchups correct
- 15 Pune localities validated

### ❌ NOT YET DONE
- Pune Neighborhood Heat Map (building next)
- Project deck (12 slides)
- Demo video (2 min)
- Deployment — Railway + Firebase Hosting
- Submission on Hack2Skill

### ❌ FEATURES DECIDED AGAINST
- Hindi language toggle — browser auto-translate sufficient
- 99acres/MagicBricks scraping — legally grey

---

## NEXT FEATURE — Pune Neighborhood Heat Map

Interactive Google Map of Pune with colored polygon overlays
per locality showing NeighbourScore at a glance.

Green = 75+, Amber = 55-74, Red = below 55

Polygon colors from leaderboard:
```
Koregaon Park  80  green
Kalyani Nagar  77  green
Baner          76  green
Kothrud        75  green
Aundh          73  green
Viman Nagar    71  amber
Magarpatta     70  amber
Kharadi        67  amber
Hinjewadi      66  amber
Hadapsar       64  amber
Kondhwa        61  amber
Katraj         60  amber
Wakad          58  amber
Wagholi        55  amber
Dhanori        50  red
```

Hover: tooltip with name + score
Click: triggers full analysis for that locality
Legend: color scale in corner

---

## ENVIRONMENT VARIABLES

Root .env:
```
GOOGLE_MAPS_API_KEY=<set>
GEMINI_API_KEY=<set>
FIREBASE_PROJECT_ID=neighbourscore-492917
PORT=5000
CPCB_API_KEY=<set>
NEWS_API_KEY=<set — GNews API>
```

frontend/.env:
```
REACT_APP_GOOGLE_MAPS_API_KEY=<same>
REACT_APP_API_URL=http://localhost:5000
```

---

## FIREBASE PROJECT

Project ID: neighbourscore-492917
Region: asia-south1 (Mumbai)
Collections:
  schools, flood_zones, crime_data,
  score_cache, shared_reports

---

## TECH STACK

Frontend: React 18 + Tailwind + Framer Motion + Recharts
Backend: Node.js + Express
Database: Firebase Firestore
AI: Gemini 1.5 Flash
Maps: Google Maps JS API + Geocoding + Places
Geospatial: ngeohash + @turf/turf
News: GNews API
Testing: Jest + Axios
Hosting: Firebase Hosting + Railway

---

## SCORE LEADERBOARD

```
1.  Koregaon Park   80   Premium
2.  Kalyani Nagar   77   Premium
3.  Baner           76   Premium
4.  Kothrud         75   Good
5.  Aundh           73   Good
6.  Viman Nagar     71   Good
7.  Magarpatta      70   Good
8.  Kharadi         67   Good
9.  Hinjewadi       66   Developing
10. Hadapsar        64   Developing
11. Kondhwa         61   Developing
12. Katraj          60   Developing
13. Wakad           58   Developing
14. Wagholi         55   Developing
15. Dhanori         50   Developing
```

---

## PROFILE WEIGHTS

| Dimension | General | Family | Professional | Retiree | Investor |
|---|---|---|---|---|---|
| air_quality | 15% | 15% | 15% | 15% | 5% |
| school_quality | 20% | 35% | 10% | 3% | 15% |
| flood_risk | 15% | 10% | 3% | 10% | 3% |
| healthcare | 15% | 10% | 15% | 30% | 10% |
| crime_safety | 15% | 20% | 15% | 20% | 10% |
| transport | 10% | 5% | 25% | 5% | 20% |
| property_value | 5% | 2% | 15% | 2% | 35% |
| greenery | 5% | 3% | 2% | 15% | 2% |

---

## HACKATHON SUBMISSION

Platform: Hack2Skill
Deadline: April 24, 2026

Template slide structure (12 slides):
1. Guidelines
2. Team Details
3. Brief about solution
4. Opportunities / USP
5. Features list
6. Process flow diagram
7. Wireframes (optional)
8. Architecture diagram
9. Technologies used
10. Implementation cost (optional)
11. MVP snapshots ← most important
12. Future development
13. Links (GitHub + Demo + MVP + Prototype)
14-15. Thank you

---

## REMAINING TIMELINE

| Task | Target |
|---|---|
| Pune Heat Map | April 15 |
| Project deck | April 16-17 |
| Demo video | April 18-20 |
| Deploy Railway + Firebase | April 22 |
| Submit | April 23 |

---

## DEMO VIDEO SCRIPT (2 min)

0:00-0:15  Problem statement
0:15-0:30  Landing page + heat map
0:30-0:50  Search Wakad → loading screen
0:50-1:10  Report card → open evidence drawer
1:10-1:30  Compare with Baner → winner banner
1:30-1:50  Profile selector → Family profile
1:50-2:00  Share URL demo

Primary locality: Wakad (lat 18.5974, lng 73.7898)
Compare: Baner (lat 18.5590, lng 73.7868)
