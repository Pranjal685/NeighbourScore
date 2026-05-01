# Mumbai Multi-City Frontend Expansion

Add Mumbai as the second supported city across the NeighbourScore frontend. Backend already handles Mumbai API requests — this is purely frontend work.

## Proposed Changes

### 1. New Data File — Mumbai Localities

#### [NEW] [mumbai_localities.json](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/data/mumbai_localities.json)

Since Pune uses GeoJSON polygons (`pune_localities.json`) for the heatmap, and we don't have GeoJSON polygons for Mumbai, the Mumbai heatmap will use **marker-based display** (circle markers at each locality coordinate with score labels). This avoids needing to create 20 GeoJSON polygons from scratch.

The file will contain the 20 Mumbai localities with coordinates, scores, and tier classification:
- **Premium (≥75):** Malabar Hill (82), Colaba (79), Worli (76), Bandra West (75)
- **Good (60–74):** Juhu (73), Dadar (72), Andheri West (69), Powai (68), Mulund (66), Borivali (65), Malad (64), Ghatkopar (63), Chembur (62), Kandivali (61), Goregaon (60)
- **Developing (<60):** Kurla (58), Vikhroli (55), Dharavi (48), Govandi (42), Mankhurd (40)

---

### 2. City Selector Component

#### [NEW] [CitySelector.jsx](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/components/CitySelector.jsx)

A reusable pill toggle component: `Pune | Mumbai`

- Default: Pune (existing behaviour preserved)
- Styled with `#6366F1` indigo, glassmorphism consistent with existing design
- Emits `onCityChange(city)` where city is `'pune'` or `'mumbai'`
- Used in both LandingPage (above search bar) and LeaderboardPage (as city tabs)

---

### 3. Landing Page Changes

#### [MODIFY] [LandingPage.jsx](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/pages/LandingPage.jsx)

Changes:
1. **Add `selectedCity` state** (default: `'pune'`), add CitySelector above search bar
2. **City-aware sample chips:**
   - Pune: existing 5 chips (Wakad, Baner, Kothrud, Hinjewadi, Koregaon Park)
   - Mumbai: 5 chips (Bandra West, Powai, Juhu, Andheri West, Colaba)
3. **City-aware preview card:**
   - Pune → existing "Baner, Pune" card (score 81)
   - Mumbai → "Bandra West, Mumbai" card (score 75)
4. **City-aware heatmap section:**
   - Heading: "Explore Pune" → "Explore {city}" 
   - Pass `selectedCity` prop to HeatMap
5. **City-aware subtext:** "any locality in Pune" → "any locality in Pune & Mumbai"
6. **CTA section:** "Pune only for now" → "Pune & Mumbai"
7. **Pass `selectedCity` to SearchBar** for location biasing

---

### 4. SearchBar Changes

#### [MODIFY] [SearchBar.jsx](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/components/SearchBar.jsx)

Changes:
1. Accept `selectedCity` prop
2. When `selectedCity === 'mumbai'`:
   - Autocomplete bounds: `{ north: 19.35, south: 18.85, east: 73.10, west: 72.75 }`
   - Geocoder fallback appends "Mumbai, India" instead of "Pune, India"
   - Placeholder: "Search locality e.g. Bandra, Andheri, Powai..."
3. When `selectedCity === 'pune'` (default): existing behaviour unchanged

---

### 5. HeatMap Changes

#### [MODIFY] [HeatMap.jsx](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/components/HeatMap.jsx)

Changes:
1. Accept `selectedCity` prop (default: `'pune'`)
2. **Pune mode** (default): Exactly as today — GeoJSON polygons from `pune_localities.json`
3. **Mumbai mode:**
   - Center: `{ lat: 19.0760, lng: 72.8777 }`, zoom: 11
   - Import `mumbai_localities.json`
   - Render circle `Marker` + `OverlayView` label for each of 20 localities (no polygons)
   - Same color coding: green (Premium) / amber (Good) / red (Developing)
   - Same tooltip on hover, same mobile bottom sheet on tap
   - Click → triggers `onLocalityClick` with correct Mumbai coordinates
4. Section heading/loading text: "Loading Pune map…" → city-aware
5. Legend remains the same (same tier colors)

---

### 6. LeaderboardPage Changes

#### [MODIFY] [LeaderboardPage.jsx](file:///c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/pages/LeaderboardPage.jsx)

Changes:
1. **Add city tabs** at the top: "Pune" | "Mumbai" (using CitySelector)
2. **Two locality arrays**: `PUNE_LOCALITIES` (existing 15) + `MUMBAI_LOCALITIES` (new 20)
3. **City-aware stats bar:**
   - Pune: 15 localities, top Koregaon Park (80), bottom Dhanori (50)
   - Mumbai: 20 localities, top Malabar Hill (82), bottom Mankhurd (40)
4. **City-aware heading/subtext:**
   - "Pune Neighborhood Leaderboard" → "{City} Neighborhood Leaderboard"
5. **Tier filters** work on both city's data
6. **Analyze button** passes correct city suffix:
   - Pune: `loc.name + ', Pune, Maharashtra, India'`
   - Mumbai: `loc.name + ', Mumbai, Maharashtra, India'`
7. **Profile selector** remains, passes profile to analyze navigation for both cities

---

### 7. App.js — No Changes Needed

The `App.js` router doesn't need changes. `handleSearch` already accepts any lat/lng/name and the backend is city-agnostic. The leaderboard page manages its own city state internally.

---

## Open Questions

> [!IMPORTANT]
> **Mumbai Heatmap: Markers vs. Polygons?**
> Since we don't have GeoJSON polygon data for Mumbai localities, I plan to use **circle markers with score labels** instead of filled polygons. This looks clean and avoids fabricating boundary data. The Pune heatmap retains its polygon view. Is this acceptable, or do you want me to create approximate polygon boundaries?

> [!NOTE]
> **City state propagation:** The city selection on LandingPage doesn't need to persist to the ReportPage since the report is generated from coordinates (city-agnostic backend). The leaderboard page manages its own city state independently. This keeps the architecture simple.

## Verification Plan

### Automated Tests
- Run `npm start` in frontend, verify no console errors
- Navigate to `/leaderboard`, switch between Pune and Mumbai tabs, verify correct data renders
- Click "Analyze" on a Mumbai locality, verify it navigates to loading → report with correct data

### Manual Verification
- Verify Pune functionality is completely unchanged (search, heatmap, leaderboard, preview card)
- Switch to Mumbai on landing page, confirm search autocomplete restricts to Mumbai
- Verify heatmap switches between Pune polygons and Mumbai markers
- Verify mobile responsive layout (320px–1440px) for city selector
- Verify all 8 animations still work

### STRICT DESIGN RULES:
- Use ONLY existing color palette: #F0F4FF, #6366F1, #10B981, #E6A817
- No new colors, no new fonts
- Keep all ErrorBoundary wraps on Maps components untouched
- Keep defensive guard in SearchBar: if (!window.google) return plain input
- CitySelector pill style must match existing profile selector pill style in LeaderboardPage