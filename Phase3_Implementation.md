Read CLAUDE.md for full project context before starting anything.

You are building Phase 3 — the complete frontend for NeighbourScore.
You have access to Stitch MCP and Figma MCP. Use them in the exact 
order described below. Do not skip any step.

=============================================================
DESIGN SYSTEM — USE THESE EXACT VALUES EVERYWHERE
=============================================================

Colors:
  Page background:  #0B1120
  Card background:  #111827
  Border:           #1E293B
  Brand accent:     #6366F1  (indigo)
  Score excellent:  #34D399  (green  — 80 to 100)
  Score good:       #FBBF24  (amber  — 60 to 79)
  Score poor:       #F87171  (red    — 0 to 59)
  Text primary:     #F1F5F9
  Text secondary:   #CBD5E1
  Text muted:       #64748B
  Text hint:        #475569

Font: "Plus Jakarta Sans" from Google Fonts
  weights: 400, 500, 600, 700

Border radius:
  Cards: 12px
  Buttons and inputs: 8px
  Pills and badges: 100px

Inspiration: Housing.com for smooth clean interactions,
Niche.com for report card structure. Dark premium data platform.
NOT cluttered. NOT colorful. Clean, minimal, serious.

=============================================================
STEP 1 — GENERATE UI WITH STITCH MCP
=============================================================

Use Stitch MCP to generate all 3 screens of NeighbourScore.

Generate Screen 1 — Search / Hero:
  Full viewport dark screen background #0B1120
  Top left: logo text "NeighbourScore" in #F1F5F9, 18px, weight 700
  Center of screen (vertically and horizontally):
    Small pill tag: "Google Solution Challenge 2026"
      background rgba(99,102,241,0.15), color #818CF8,
      font-size 11px, padding 4px 14px, border-radius 100px
    Heading: "Know your neighborhood before you move."
      font-size 32px, weight 700, color #F1F5F9, margin-top 16px
      max-width 520px, text-align center, line-height 1.3
    Subtext: "8-dimension AI report card for any locality in Pune
      — using real government data, not opinions."
      font-size 14px, color #64748B, margin-top 10px, text-align center
    Search bar below subtext (margin-top 28px):
      Container: background #1E293B, border 1px solid #334155,
        border-radius 12px, padding 6px 6px 6px 18px,
        display flex, align-items center, max-width 500px
      Input inside: background transparent, border none, color #F1F5F9,
        font-size 14px, flex 1, placeholder color #475569,
        placeholder text "Search locality e.g. Wakad, Pune..."
      Button inside: background #6366F1, color white, font-size 14px,
        font-weight 600, padding 10px 24px, border-radius 8px,
        border none, text "Analyze"
  Bottom of screen:
    3 small stat pills in a row, centered:
      "20,000+ CBSE Schools" | "35 Pune Districts" | "8 Data Dimensions"
      Each pill: background #111827, border 1px solid #1E293B,
        color #64748B, font-size 11px, padding 6px 14px, border-radius 100px

Generate Screen 2 — Report Card (main output screen):
  Top bar:
    Left: logo "NeighbourScore" 16px weight 700 #F1F5F9
    Right: locality name "Wakad, Pune" 13px #64748B
    Border-bottom: 1px solid #1E293B, padding 14px 32px, bg #0B1120

  Below top bar, full-width dark map strip:
    Height 240px, dark styled Google Map centered on Wakad Pune
    Single marker at center

  Main content area (padding 24px 32px, max-width 900px, margin 0 auto):

    Locality header row:
      Left side:
        "Wakad, Pune" — 22px weight 700 #F1F5F9
        "Pune District, Maharashtra · analyzed just now"
          13px #64748B, margin-top 4px
      Right side:
        Button "+ Compare locality"
          background transparent, border 1px solid rgba(99,102,241,0.4),
          color #818CF8, font-size 12px, padding 7px 16px, border-radius 8px
      margin-bottom 20px

    Overall score card:
      Background #111827, border 1px solid #1E293B, border-radius 16px,
      padding 24px, display flex, align-items center, gap 28px, margin-bottom 24px
      
      Left: SVG circular gauge 110px × 110px
        Outer ring: circle stroke #1E293B, stroke-width 8, fill none
        Inner ring: circle stroke #34D399, stroke-width 8, fill none,
          stroke-linecap round,
          stroke-dasharray calculated for score 71 out of 100
          (circumference = 2 * pi * 38 = 238.76, filled = 238.76 * 0.71 = 169.5)
          stroke-dashoffset -59 to start from top
        Center text: "71" — 28px weight 700 color #34D399
        Below center: "/ 100" — 10px #64748B

      Right side:
        Badge pill: "Good" — bg rgba(52,211,153,0.12), color #34D399,
          font-size 11px, font-weight 600, padding 3px 12px,
          border-radius 100px, margin-bottom 8px
        Heading: "NeighbourScore" — 16px weight 600 #F1F5F9
        Body: "Wakad scores well on greenery and flood safety but has
          room to improve on transport connectivity. Air quality is
          moderate — November to January are the worst months for
          families with young children."
          13px #64748B, line-height 1.7

    8 dimension cards in 2-column grid:
      grid-template-columns: 1fr 1fr, gap 10px

      Each dimension card layout:
        Background #111827, border 1px solid #1E293B, border-radius 12px,
        padding 14px 16px, border-left 3px solid {score color}

        Top row (display flex, justify-content space-between, align-items center):
          Left: emoji icon (16px) + dimension name (12px weight 500 #CBD5E1)
            gap 8px, display flex, align-items center
          Right: score number (14px weight 700, score color)

        Progress bar (margin-top 8px, margin-bottom 8px):
          Track: height 3px, background #1E293B, border-radius 100px
          Fill: height 3px, width = score%, background = score color,
            border-radius 100px

        Narrative text:
          11px #475569, line-height 1.6

        Weight label (bottom right):
          10px #334155, margin-top 6px, text-align right

      Card 1: Air Quality
        icon 🌬️, name "Air quality", score 80, color #FBBF24, weight "15%"
        narrative "AQI 87 — moderate. November to January are worst months
          for PM2.5 levels, which can affect young children."

      Card 2: School Quality
        icon 🏫, name "School quality", score 70, color #34D399, weight "20%"
        narrative "7 CBSE schools within 3km. Good density for families
          with school-going children."

      Card 3: Flood Risk
        icon 🌊, name "Flood risk", score 100, color #34D399, weight "15%"
        narrative "Not in any NDMA flood hazard zone. Safe from
          riverine flooding year-round."

      Card 4: Healthcare
        icon 🏥, name "Healthcare", score 65, color #34D399, weight "15%"
        narrative "5 hospitals within 3km. Emergency medical care
          is reasonably accessible."

      Card 5: Crime Safety
        icon 🛡️, name "Crime safety", score 72, color #FBBF24, weight "15%"
        narrative "Pune district: 578 crimes per 100k population.
          Around the city average — neither safe nor concerning."

      Card 6: Transport
        icon 🚌, name "Transport", score 55, color #F87171, weight "10%"
        narrative "3 PMPML bus stops within 500m. A personal vehicle
          is recommended for daily commuting."

      Card 7: Property Value
        icon 📈, name "Property value", score 75, color #34D399, weight "5%"
        narrative "₹8,200 per sqft with 8% appreciation in 12 months.
          Strong investment area with consistent demand."

      Card 8: Greenery
        icon 🌳, name "Greenery", score 60, color #34D399, weight "5%"
        narrative "3 parks within 1km. Decent green cover for a
          growing western Pune suburb."

Generate Screen 3 — Compare Mode:
  Everything from Screen 2 stays visible above.
  Below the 8 dimension cards, add compare section:

  Winner banner:
    "Baner scores 81 vs Wakad scores 71 — Baner wins on Air Quality
    and Healthcare"
    Background rgba(99,102,241,0.08), border 1px solid rgba(99,102,241,0.2),
    color #818CF8, font-size 13px, padding 12px 18px, border-radius 10px,
    margin-bottom 16px

  Two column grid (gap 12px):
    Left card — Wakad (loser):
      Background #111827, border 1px solid #1E293B, border-radius 12px,
      padding 20px
      Locality name: "Wakad" 15px weight 600 #F1F5F9
      Score: "71" 36px weight 700 #FBBF24
      Divider line 1px #1E293B margin 12px 0
      Dimension rows (each row: flex space-between, padding 6px 0,
        border-bottom 1px solid #1E293B):
        Air quality: label 11px #64748B | value "80" 11px weight 600 #475569
        Schools:     label 11px #64748B | value "70" 11px weight 600 #34D399
        Healthcare:  label 11px #64748B | value "65" 11px weight 600 #475569
        Transport:   label 11px #64748B | value "55" 11px weight 600 #475569
        Flood risk:  label 11px #64748B | value "100" 11px weight 600 #34D399

    Right card — Baner (winner):
      Background rgba(52,211,153,0.04),
      border 1px solid rgba(52,211,153,0.25), border-radius 12px,
      padding 20px
      Winner badge: "Winner" — bg rgba(52,211,153,0.12), color #34D399,
        font-size 10px, padding 2px 10px, border-radius 100px,
        display block, width fit-content, margin-bottom 6px
      Locality name: "Baner" 15px weight 600 #F1F5F9
      Score: "81" 36px weight 700 #34D399
      Divider line 1px rgba(52,211,153,0.1) margin 12px 0
      Dimension rows (winning values in green #34D399, losing in #475569):
        Air quality: label 11px #64748B | value "100" 11px weight 600 #34D399
        Schools:     label 11px #64748B | value "60" 11px weight 600 #475569
        Healthcare:  label 11px #64748B | value "85" 11px weight 600 #34D399
        Transport:   label 11px #64748B | value "70" 11px weight 600 #34D399
        Flood risk:  label 11px #64748B | value "100" 11px weight 600 #34D399

Save all 3 generated screens from Stitch.

=============================================================
STEP 2 — PUSH TO FIGMA USING FIGMA MCP
=============================================================

Use Figma MCP to:
1. Create a new Figma file called "NeighbourScore UI"
2. Create 3 frames: "Search", "Report Card", "Compare Mode"
3. Push all 3 Stitch-generated screens into these frames
4. Set frame dimensions: 1440 × 900 for desktop screens
5. Organize layers properly — name each layer meaningfully:
   SearchHero, TopBar, MapStrip, ScoreCard, DimensionGrid,
   DimensionCard_AirQuality, DimensionCard_Schools, etc.
6. Create a Color Styles panel in Figma with all 8 brand colors named:
   bg-page, bg-card, border-default, accent-indigo,
   score-excellent, score-good, score-poor,
   text-primary, text-secondary, text-muted
7. Share the Figma file link in the terminal output

=============================================================
STEP 3 — BUILD REACT FRONTEND
=============================================================

Working directory: C:\Users\Pranjal\OneDrive\Desktop\NeighbourScore\frontend

Run:
npx create-react-app .
npm install axios @react-google-maps/api
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Create frontend/.env:
REACT_APP_GOOGLE_MAPS_API_KEY=<copy from root .env>
REACT_APP_API_URL=http://localhost:3000

In tailwind.config.js:
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'bg-page': '#0B1120',
        'bg-card': '#111827',
        'border-default': '#1E293B',
        'accent': '#6366F1',
        'score-green': '#34D399',
        'score-amber': '#FBBF24',
        'score-red': '#F87171',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      }
    }
  },
  plugins: []
}

Replace src/index.css entirely with:
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
* { box-sizing: border-box; }
body { background-color: #0B1120; font-family: 'Plus Jakarta Sans', sans-serif; color: #F1F5F9; margin: 0; }

--- src/services/api.js ---
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

--- src/components/SearchBar.jsx ---
Use @react-google-maps/api LoadScript and Autocomplete.
API key from process.env.REACT_APP_GOOGLE_MAPS_API_KEY.
Autocomplete options: { componentRestrictions: { country: 'in' } }
On place selected: extract lat(), lng(), formatted_address.
Call onSearch(lat, lng, name) prop.

Design exactly matching Screen 1 from Stitch output:
Full viewport height, centered content, dark background.
Pill tag, heading, subtext, search bar with Analyze button,
3 stat pills at bottom.
Show loading spinner inside Analyze button when isLoading prop is true.

Props: { onSearch, isLoading }

--- src/components/ScoreGauge.jsx ---
SVG circular gauge 120px × 120px.
circumference = 2 * Math.PI * 38 = 238.76
filled = circumference * (score / 100)
stroke-dasharray = `${filled} ${circumference}`
stroke-dashoffset = circumference * 0.25 (start from top)

CSS animation on mount:
@keyframes gaugeIn {
  from { stroke-dasharray: 0 238.76; }
  to   { stroke-dasharray: {filled} 238.76; }
}
animation: gaugeIn 1.2s ease-out forwards

Score color logic:
  score >= 80 → #34D399, label "Excellent"
  score >= 60 → #FBBF24, label "Good"  
  score < 60  → #F87171, label "Needs attention"

Props: { score }

--- src/components/DimensionCard.jsx ---
Exactly matching the dimension cards from Screen 2.
Left border color = score color.
Progress bar fill = score color, width = score%.
Props: { name, score, weight, narrative, icon }

getScoreColor(score):
  score >= 80 → '#34D399'
  score >= 60 → '#FBBF24'
  else → '#F87171'

--- src/components/ReportCard.jsx ---
Exactly matching Screen 2 layout.
Import and use ScoreGauge and DimensionCard.
Locality header with compare button.
Overall score card with gauge on left, narrative on right.
2-column grid of 8 DimensionCards.
On compare button click: call onCompare() prop.

DIMENSION_ICONS constant:
const DIMENSION_ICONS = {
  air_quality: '🌬️', school_quality: '🏫', flood_risk: '🌊',
  healthcare: '🏥', crime_safety: '🛡️', transport: '🚌',
  property_value: '📈', greenery: '🌳'
}

DIMENSION_NAMES constant:
const DIMENSION_NAMES = {
  air_quality: 'Air quality', school_quality: 'School quality',
  flood_risk: 'Flood risk', healthcare: 'Healthcare',
  crime_safety: 'Crime safety', transport: 'Transport',
  property_value: 'Property value', greenery: 'Greenery'
}

Props: { data, onCompare }

--- src/components/MapView.jsx ---
Use @react-google-maps/api GoogleMap and Marker.
Map height 260px, width 100%, border-radius 0 (full bleed).
Zoom 14, center { lat, lng }.
Dark map styles array (as specified in design system above).
Props: { lat, lng }

--- src/components/CompareMode.jsx ---
Second search bar at top (reuse SearchBar component, smaller).
After second result loads: render compare layout exactly matching Screen 3.
Winner banner, two column grid with winner/loser cards.
Handle second API call internally with useState and useEffect.
Props: { firstResult, firstLat, firstLng }

--- src/App.js ---
useState for: appState, result, currentLat, currentLng, showCompare

appState machine:
  'search'  → show SearchBar fullscreen
  'loading' → show loading screen
  'results' → show full report

handleSearch(lat, lng, localityName):
  setAppState('loading')
  setCurrentLat(lat), setCurrentLng(lng)
  const data = await getScore(lat, lng, localityName)
  await new Promise(r => setTimeout(r, 1500)) // min loading time
  setResult(data)
  setAppState('results')

Loading screen design:
  Full viewport, centered, background #0B1120
  Indigo spinner ring (CSS border animation, 40px, border-top #6366F1)
  Locality name: 16px #F1F5F9, margin-top 20px
  "Analyzing neighborhood..." 13px #64748B, margin-top 6px
  Animated dots cycling: . .. ...

Results screen layout:
  Top bar (position sticky, top 0, z-index 10):
    bg #0B1120, border-bottom 1px solid #1E293B, padding 12px 32px
    Left: "NeighbourScore" 16px weight 700 #F1F5F9
    Right: locality name 13px #64748B
  MapView component (full width, no horizontal padding)
  Content area (padding 24px 32px, max-width 900px, margin 0 auto):
    ReportCard with data prop and onCompare={() => setShowCompare(true)}
    If showCompare:
      CompareMode with firstResult, firstLat, firstLng props

=============================================================
STEP 4 — TEST END TO END
=============================================================

Make sure backend is running:
cd ../backend && node index.js

Start frontend:
cd ../frontend && npm start

Test checklist — verify each one works:
1. Landing page loads with centered search bar
2. Google Places Autocomplete suggests Pune localities as you type
3. Selecting a locality triggers loading state with spinner
4. Report card renders with all 8 dimension cards populated
5. ScoreGauge ring animates from 0 to score value on load
6. Progress bars on dimension cards show correct fill widths
7. Left border color on each card matches score band
8. Dark styled Google Map renders centered on searched locality
9. Compare button appears and clicking it shows second search bar
10. Comparing Wakad with Baner shows winner banner with Baner winning
11. On mobile width (resize browser to 375px):
    - Search bar is full width
    - Dimension cards are single column
    - Map is full width

Report any errors with the full error message.
Do not mark Phase 3 complete until all 11 checklist items pass.

=============================================================
CRITICAL RULES — NEVER VIOLATE THESE
=============================================================

1. Use only hardcoded hex colors from the design system — no Tailwind 
   color names like "green-400" or "indigo-500", always use exact hex
2. Font must be Plus Jakarta Sans loaded from Google Fonts
3. Never show score 0 — minimum displayed value is 20
4. If API dimension fails, show "--" not 0
5. Mobile responsive required — single column under 640px width
6. Loading state minimum 1.5 seconds (use setTimeout)
7. All API keys from process.env only — never hardcoded
8. Use functional React components with hooks only
9. Keep all components in src/components/ folder
10. Keep API calls only in src/services/api.js
11. Use the Stitch-generated and Figma-refined design as the 
visual reference — match it pixel-for-pixel in React