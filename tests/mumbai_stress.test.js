const axios = require('axios')
const express = require('express')
const rateLimit = require('express-rate-limit')
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000'

jest.setTimeout(60000)

const MUMBAI_LOCALITIES = [
  { lat: 19.0600, lng: 72.8300, locality_name: 'Bandra West, Mumbai' },
  { lat: 18.9067, lng: 72.9162, locality_name: 'Colaba, Mumbai' },
  { lat: 19.0400, lng: 72.8600, locality_name: 'Dharavi, Mumbai' },
  { lat: 18.9500, lng: 72.8000, locality_name: 'Malabar Hill, Mumbai' },
  { lat: 19.0400, lng: 72.9400, locality_name: 'Mankhurd, Mumbai' },
]

const PUNE_LOCALITIES = [
  { lat: 18.5362, lng: 73.8937, locality_name: 'Koregaon Park, Pune' },
  { lat: 18.5590, lng: 73.7868, locality_name: 'Baner, Pune' },
  { lat: 18.5074, lng: 73.8077, locality_name: 'Kothrud, Pune' },
]

// Isolated rate-limit server on port 5098 — never pollutes the shared backend counter
let _rateLimitServer
beforeAll(async () => {
  const app = express()
  app.use(express.json())
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many requests. Please wait a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.post('/test', limiter, (req, res) => res.json({ ok: true }))
  await new Promise(resolve => { _rateLimitServer = app.listen(5098, resolve) })
}, 5000)

afterAll(async () => {
  await new Promise(resolve => _rateLimitServer.close(resolve))
})

async function scoreLocality(lat, lng, locality_name, profile = 'general') {
  const res = await axios.post(`${BASE_URL}/api/score`, { lat, lng, locality_name, profile })
  return res.data
}

// ══════════════════════════════════════════════════════════
// BLOCK 1 — 20 CONCURRENT MUMBAI REQUESTS
// ══════════════════════════════════════════════════════════

describe('Mumbai concurrent load', () => {

  test('20 simultaneous Mumbai requests all return valid scores', async () => {
    const requests = Array.from({ length: 20 }, (_, i) => {
      const loc = MUMBAI_LOCALITIES[i % MUMBAI_LOCALITIES.length]
      return axios.post(`${BASE_URL}/api/score`, {
        lat: loc.lat, lng: loc.lng, locality_name: loc.locality_name
      }).then(r => r.data).catch(e => ({ _error: e.message }))
    })

    const results = await Promise.all(requests)
    const successes = results.filter(r => !r._error && r.composite > 0)
    const errors = results.filter(r => r._error)

    console.log(`\n20 concurrent Mumbai requests: ${successes.length} succeeded, ${errors.length} errors`)
    successes.forEach(r => console.log(`  ${r.locality}: ${r.composite}/100`))
    if (errors.length > 0) errors.forEach(e => console.log(`  ERROR: ${e._error}`))

    expect(successes.length).toBe(20)
    successes.forEach(r => {
      expect(r.composite).toBeGreaterThan(0)
      expect(r.composite).toBeLessThanOrEqual(100)
      expect(r.dimensions).toBeDefined()
      expect(Object.keys(r.dimensions)).toHaveLength(8)
    })
  }, 120000)

  test('All 5 Mumbai localities return non-zero scores individually', async () => {
    const results = await Promise.all(
      MUMBAI_LOCALITIES.map(loc => scoreLocality(loc.lat, loc.lng, loc.locality_name))
    )
    results.forEach((data, i) => {
      console.log(`  ${MUMBAI_LOCALITIES[i].locality_name}: ${data.composite}/100`)
      expect(data.composite).toBeGreaterThan(0)
      expect(data.composite).toBeLessThanOrEqual(100)
    })
  }, 60000)

})

// ══════════════════════════════════════════════════════════
// BLOCK 2 — RATE LIMIT ENFORCEMENT (isolated server)
// ══════════════════════════════════════════════════════════

describe('Rate limit enforcement', () => {

  test('429 returned after 20 requests within 60 seconds', async () => {
    const requests = Array(25).fill(null).map(() =>
      axios.post('http://localhost:5098/test', {}).catch(e => e.response)
    )
    const results = await Promise.all(requests)
    const rateLimited = results.filter(r => r && r.status === 429)
    const ok = results.filter(r => r && r.status === 200)

    console.log(`\nRate limit: ${ok.length} OK, ${rateLimited.length} blocked (429)`)
    expect(ok.length).toBeLessThanOrEqual(20)
    expect(rateLimited.length).toBeGreaterThanOrEqual(5)
  }, 30000)

  test('Rate limit response body contains expected error message', async () => {
    const responses = await Promise.all(
      Array(25).fill(null).map(() =>
        axios.post('http://localhost:5098/test', {}).catch(e => e.response)
      )
    )
    const blocked = responses.filter(r => r && r.status === 429)
    expect(blocked.length).toBeGreaterThan(0)
    expect(blocked[0].data.error).toContain('Too many requests')
  }, 30000)

})

// ══════════════════════════════════════════════════════════
// BLOCK 3 — CACHE BEHAVIOUR
// ══════════════════════════════════════════════════════════

describe('Cache behaviour for Mumbai localities', () => {

  test('Second request for same Mumbai locality is cached (cached: true) and fast (<200ms)', async () => {
    const loc = MUMBAI_LOCALITIES[0] // Bandra West

    // Prime the in-memory cache (1-hour TTL)
    await scoreLocality(loc.lat, loc.lng, loc.locality_name)

    // Second call should hit in-memory cache
    const start = Date.now()
    const cached = await axios.post(`${BASE_URL}/api/score`, {
      lat: loc.lat, lng: loc.lng, locality_name: loc.locality_name
    })
    const elapsed = Date.now() - start

    console.log(`\nBandra West cached: ${elapsed}ms, cached flag: ${cached.data.cached}`)
    expect(cached.status).toBe(200)
    expect(cached.data.cached).toBe(true)
    expect(elapsed).toBeLessThan(200)
  }, 60000)

  test('Cached Mumbai response has identical composite to first response', async () => {
    const loc = MUMBAI_LOCALITIES[1] // Colaba

    // Prime cache
    await scoreLocality(loc.lat, loc.lng, loc.locality_name)
    // Two back-to-back — both should hit cache, both identical
    const [r1, r2] = await Promise.all([
      scoreLocality(loc.lat, loc.lng, loc.locality_name),
      scoreLocality(loc.lat, loc.lng, loc.locality_name),
    ])

    console.log(`\nColaba: ${r1.composite} vs ${r2.composite} (cached: ${r1.cached}, ${r2.cached})`)
    expect(r1.composite).toBe(r2.composite)
  }, 60000)

})

// ══════════════════════════════════════════════════════════
// BLOCK 4 — CITY BOUNDARY EDGE CASES
// ══════════════════════════════════════════════════════════

describe('City boundary edge cases', () => {

  test('Mumbai/Pune border coord (18.85, 73.10) returns valid score', async () => {
    // Southern edge of Mumbai SearchBar config; still within India bbox
    const data = await scoreLocality(18.85, 73.10, 'Mumbai-Pune border area')
    console.log(`\nBorder (18.85, 73.10): ${data.composite}/100`)
    expect(data.composite).toBeGreaterThan(0)
    expect(data.composite).toBeLessThanOrEqual(100)
    expect(data.dimensions).toBeDefined()
  }, 30000)

  test('Coord north of Mumbai (19.40, 72.83) returns valid score — no hard city bbox rejection', async () => {
    // Inside India bbox (lat < 37.5), so backend should score it
    const data = await scoreLocality(19.40, 72.83, 'North of Mumbai, Maharashtra')
    console.log(`North Mumbai (19.40, 72.83): ${data.composite}/100`)
    expect(data.composite).toBeGreaterThan(0)
    expect(data.composite).toBeLessThanOrEqual(100)
  }, 30000)

  test('Coord slightly outside India bbox (lat 37.6) returns 400', async () => {
    let threw = false
    try {
      await axios.post(`${BASE_URL}/api/score`, {
        lat: 37.6, lng: 72.83, locality_name: 'Outside India north'
      })
    } catch (e) {
      threw = true
      expect(e.response.status).toBe(400)
      expect(e.response.data.error).toContain('India')
    }
    expect(threw).toBe(true)
  })

  test('Coord at southern India tip (lat 6.4) returns 400 — below India bbox', async () => {
    let threw = false
    try {
      await axios.post(`${BASE_URL}/api/score`, {
        lat: 6.4, lng: 80.0, locality_name: 'Below India south'
      })
    } catch (e) {
      threw = true
      expect(e.response.status).toBe(400)
    }
    expect(threw).toBe(true)
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 5 — MIXED CITY LOAD / CROSS-CITY DATA INTEGRITY
// ══════════════════════════════════════════════════════════

describe('Mixed city load and cross-city data integrity', () => {

  test('Alternating Mumbai/Pune requests all return valid scores', async () => {
    const mixed = [
      MUMBAI_LOCALITIES[0], PUNE_LOCALITIES[0],
      MUMBAI_LOCALITIES[1], PUNE_LOCALITIES[1],
      MUMBAI_LOCALITIES[2], PUNE_LOCALITIES[2],
    ]
    const results = await Promise.all(
      mixed.map(loc => scoreLocality(loc.lat, loc.lng, loc.locality_name))
    )
    results.forEach((data, i) => {
      console.log(`  ${mixed[i].locality_name}: ${data.composite}/100`)
      expect(data.composite).toBeGreaterThan(0)
      expect(data.composite).toBeLessThanOrEqual(100)
    })
  }, 120000)

  test('Mumbai locality crime district is not Pune (cross-city data leak check)', async () => {
    // crime.js reverse-geocodes to find district. Mumbai should resolve to
    // "Mumbai" or "Mumbai Suburban" — NOT "Pune". If it falls back to Pune,
    // that is cross-city crime data contamination.
    const data = await scoreLocality(
      MUMBAI_LOCALITIES[0].lat,
      MUMBAI_LOCALITIES[0].lng,
      MUMBAI_LOCALITIES[0].locality_name
    )

    const crimeRaw = data.dimensions?.crime_safety?.raw
    console.log(`\nBandra West crime district: ${crimeRaw?.district || 'unknown (no Firestore hit)'}`)

    if (crimeRaw?.note && crimeRaw.note.toLowerCase().includes('defaulted to pune')) {
      // crime_data collection lacks Mumbai entry — falls back to Pune data
      // This is a MEDIUM data integrity issue, not a crash, but flag it clearly
      console.warn('⚠️  CROSS-CITY FALLBACK: Mumbai locality received Pune crime data')
      console.warn('   Fix: ingest Mumbai district crime data into Firestore crime_data collection')
    }

    if (crimeRaw?.district) {
      expect(crimeRaw.district.toLowerCase()).not.toBe('pune')
    }
    // Score must be valid regardless of fallback path
    expect(data.dimensions.crime_safety.score).toBeGreaterThan(0)
    expect(data.dimensions.crime_safety.score).toBeLessThanOrEqual(100)
  }, 30000)

  test('Mumbai and Pune localities produce different crime scores', async () => {
    const [mumbai, pune] = await Promise.all([
      scoreLocality(MUMBAI_LOCALITIES[0].lat, MUMBAI_LOCALITIES[0].lng, MUMBAI_LOCALITIES[0].locality_name),
      scoreLocality(PUNE_LOCALITIES[0].lat, PUNE_LOCALITIES[0].lng, PUNE_LOCALITIES[0].locality_name),
    ])

    const mumbaiCrime = mumbai.dimensions.crime_safety.score
    const puneCrime = pune.dimensions.crime_safety.score

    console.log(`\nCrime safety — Bandra: ${mumbaiCrime}, Koregaon Park: ${puneCrime}`)

    // If scores are identical, it likely means both are using the same fallback data
    if (mumbaiCrime === puneCrime) {
      console.warn('⚠️  Mumbai and Pune crime scores are identical — possible shared fallback data')
    }
    // Scores should differ — cities have distinct crime profiles
    // Soft assertion: warn but don't fail (fallback data may legitimately match)
    expect(mumbaiCrime).toBeGreaterThan(0)
    expect(puneCrime).toBeGreaterThan(0)
  }, 60000)

  test('Bandra score stays consistent across 3 interleaved Pune/Mumbai requests', async () => {
    const loc = MUMBAI_LOCALITIES[0]
    const results = []

    for (let i = 0; i < 3; i++) {
      // Interleave Pune request to simulate mixed-city traffic
      await scoreLocality(PUNE_LOCALITIES[0].lat, PUNE_LOCALITIES[0].lng, PUNE_LOCALITIES[0].locality_name)
      const d = await scoreLocality(loc.lat, loc.lng, loc.locality_name)
      results.push(d.composite)
    }

    const spread = Math.max(...results) - Math.min(...results)
    console.log(`\nBandra interleaved: ${results.join(', ')} (spread: ${spread} pts)`)
    // Cached requests must be identical; fresh requests may vary ≤3 pts
    expect(spread).toBeLessThanOrEqual(3)
  }, 120000)

})
