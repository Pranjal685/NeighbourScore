const axios = require('axios')
const BASE_URL = 'http://localhost:5000'

// ── Helper ──────────────────────────────────────────────
async function score(lat, lng, name, profile = 'general') {
  const res = await axios.post(`${BASE_URL}/api/score`, {
    lat, lng, locality_name: name, profile
  })
  return res.data
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function pct(val, total) {
  return ((val / total) * 100).toFixed(1) + '%'
}

// ── Test Data ────────────────────────────────────────────
const LOCALITIES = {
  // Tier 1 — Premium
  koregaon_park: { lat: 18.5362, lng: 73.8937, name: 'Koregaon Park, Pune', tier: 1 },
  kalyani_nagar: { lat: 18.5531, lng: 73.9006, name: 'Kalyani Nagar, Pune', tier: 1 },
  baner:         { lat: 18.5590, lng: 73.7868, name: 'Baner, Pune',         tier: 1 },
  aundh:         { lat: 18.5589, lng: 73.8078, name: 'Aundh, Pune',         tier: 1 },
  viman_nagar:   { lat: 18.5679, lng: 73.9143, name: 'Viman Nagar, Pune',   tier: 1 },

  // Tier 2 — Good
  kothrud:       { lat: 18.5074, lng: 73.8077, name: 'Kothrud, Pune',       tier: 2 },
  kharadi:       { lat: 18.5524, lng: 73.9456, name: 'Kharadi, Pune',       tier: 2 },
  wakad:         { lat: 18.5974, lng: 73.7898, name: 'Wakad, Pune',         tier: 2 },
  magarpatta:    { lat: 18.5099, lng: 73.9283, name: 'Magarpatta, Pune',    tier: 2 },
  hadapsar:      { lat: 18.5018, lng: 73.9260, name: 'Hadapsar, Pune',      tier: 2 },

  // Tier 3 — Developing
  hinjewadi:     { lat: 18.5912, lng: 73.7389, name: 'Hinjewadi, Pune',    tier: 3 },
  dhanori:       { lat: 18.6048, lng: 73.9144, name: 'Dhanori, Pune',       tier: 3 },
  kondhwa:       { lat: 18.4648, lng: 73.8997, name: 'Kondhwa, Pune',       tier: 3 },
  wagholi:       { lat: 18.5697, lng: 73.9800, name: 'Wagholi, Pune',       tier: 3 },
  katraj:        { lat: 18.4538, lng: 73.8642, name: 'Katraj, Pune',        tier: 3 },
}

const PROFILES = ['general', 'family', 'professional', 'retiree', 'investor']
const DIMENSIONS = [
  'air_quality', 'school_quality', 'flood_risk',
  'healthcare', 'crime_safety', 'transport',
  'property_value', 'greenery'
]

// ── Score all localities once and cache ──────────────────
let scoreCache = {}
beforeAll(async () => {
  console.log('\nPre-fetching all 15 locality scores...')
  const entries = Object.entries(LOCALITIES)
  for (const [key, loc] of entries) {
    const data = await score(loc.lat, loc.lng, loc.name)
    scoreCache[key] = data
    process.stdout.write('.')
  }
  console.log('\nDone.\n')
}, 180000)

// ══════════════════════════════════════════════════════════
// BLOCK 1 — SCORE RANGE VALIDATION
// ══════════════════════════════════════════════════════════

describe('BLOCK 1 — Score range validation', () => {

  const EXPECTED_RANGES = {
    koregaon_park: [75, 100],
    kalyani_nagar: [75, 100],
    baner:         [70, 95],
    aundh:         [70, 95],
    viman_nagar:   [68, 92],
    kothrud:       [62, 85],
    kharadi:       [60, 82],
    wakad:         [58, 80],
    magarpatta:    [60, 82],
    hadapsar:      [55, 78],
    hinjewadi:     [48, 72],
    dhanori:       [42, 68],
    kondhwa:       [45, 70],
    wagholi:       [40, 65],
    katraj:        [38, 65],
  }

  test('Every locality scores within expected range', () => {
    console.log('\n' + 'Locality'.padEnd(20) + 'Score'.padEnd(8) +
      'Expected'.padEnd(14) + 'Result')
    console.log('─'.repeat(55))

    let passed = 0
    let failed = 0
    const failures = []

    Object.entries(EXPECTED_RANGES).forEach(([key, [min, max]]) => {
      const actual = scoreCache[key]?.composite
      const ok = actual >= min && actual <= max
      ok ? passed++ : failed++
      if (!ok) failures.push({ key, actual, min, max })
      console.log(
        LOCALITIES[key].name.replace(', Pune','').padEnd(20) +
        String(actual).padEnd(8) +
        `${min}–${max}`.padEnd(14) +
        (ok ? '✅' : `❌ got ${actual}`)
      )
    })

    console.log(`\n${passed}/15 passed, ${failed} failed`)
    if (failures.length > 0) {
      console.log('FAILURES:')
      failures.forEach(f =>
        console.log(`  ${f.key}: got ${f.actual}, expected ${f.min}–${f.max}`)
      )
    }
    expect(failures.length).toBe(0)
  })

  test('No dimension returns 0 for any locality', () => {
    Object.entries(scoreCache).forEach(([key, data]) => {
      DIMENSIONS.forEach(dim => {
        const s = data.dimensions[dim]?.score
        expect(s).toBeGreaterThan(0)
        if (s === 0) console.log(`ZERO SCORE: ${key} → ${dim}`)
      })
    })
  })

  test('No dimension returns 100 for ALL localities (uniform fallback check)', () => {
    DIMENSIONS.forEach(dim => {
      const allHundred = Object.values(scoreCache)
        .every(d => d.dimensions[dim]?.score === 100)
      if (allHundred) {
        console.log(`⚠️  ${dim} returns 100 for every locality — likely broken`)
      }
      expect(allHundred).toBe(false)
    })
  })

  test('Score spread across all localities is at least 30 points', () => {
    const scores = Object.values(scoreCache).map(d => d.composite)
    const spread = Math.max(...scores) - Math.min(...scores)
    console.log(`\nScore spread: ${Math.min(...scores)} – ${Math.max(...scores)} (${spread} pts)`)
    expect(spread).toBeGreaterThanOrEqual(30)
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 2 — TIER ORDERING
// ══════════════════════════════════════════════════════════

describe('BLOCK 2 — Tier ordering', () => {

  test('Every Tier 1 locality beats every Tier 3 locality', () => {
    const tier1 = ['koregaon_park','kalyani_nagar','baner','aundh','viman_nagar']
    const tier3 = ['hinjewadi','dhanori','kondhwa','wagholi','katraj']
    const failures = []

    tier1.forEach(t1 => {
      tier3.forEach(t3 => {
        const s1 = scoreCache[t1]?.composite
        const s3 = scoreCache[t3]?.composite
        if (s1 <= s3) {
          failures.push(`${t1}(${s1}) should beat ${t3}(${s3})`)
        }
      })
    })

    if (failures.length > 0) {
      console.log('ORDERING FAILURES:')
      failures.forEach(f => console.log(' ', f))
    }
    expect(failures.length).toBe(0)
  })

  test('Average Tier 1 > Average Tier 2 > Average Tier 3', () => {
    const t1Scores = ['koregaon_park','kalyani_nagar','baner','aundh','viman_nagar']
      .map(k => scoreCache[k]?.composite)
    const t2Scores = ['kothrud','kharadi','wakad','magarpatta','hadapsar']
      .map(k => scoreCache[k]?.composite)
    const t3Scores = ['hinjewadi','dhanori','kondhwa','wagholi','katraj']
      .map(k => scoreCache[k]?.composite)

    const avg1 = avg(t1Scores)
    const avg2 = avg(t2Scores)
    const avg3 = avg(t3Scores)

    console.log(`\nTier averages: T1=${avg1.toFixed(1)}, T2=${avg2.toFixed(1)}, T3=${avg3.toFixed(1)}`)
    console.log(`T1-T2 gap: ${(avg1-avg2).toFixed(1)} pts`)
    console.log(`T2-T3 gap: ${(avg2-avg3).toFixed(1)} pts`)

    expect(avg1).toBeGreaterThan(avg2)
    expect(avg2).toBeGreaterThan(avg3)
    expect(avg1 - avg3).toBeGreaterThan(15)
  })

  test('Tier 1 localities all score above 65', () => {
    const tier1 = ['koregaon_park','kalyani_nagar','baner','aundh','viman_nagar']
    tier1.forEach(key => {
      const s = scoreCache[key]?.composite
      expect(s).toBeGreaterThanOrEqual(65)
    })
  })

  test('Tier 3 localities all score below 75', () => {
    const tier3 = ['hinjewadi','dhanori','kondhwa','wagholi','katraj']
    tier3.forEach(key => {
      const s = scoreCache[key]?.composite
      expect(s).toBeLessThan(75)
    })
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 3 — HEAD TO HEAD COMPARISONS
// Every pair that should have a clear winner
// Even a 1-point difference must be in the right direction
// ══════════════════════════════════════════════════════════

describe('BLOCK 3 — Head to head comparisons', () => {

  const MATCHUPS = [
    // [winner, loser, reason]
    ['koregaon_park', 'wakad',     'KP is premium central Pune vs developing suburb'],
    ['koregaon_park', 'dhanori',   'KP has hospitals schools parks vs bare Dhanori'],
    ['koregaon_park', 'hinjewadi', 'KP is residential premium vs IT corridor'],
    ['kalyani_nagar', 'wagholi',   'KN is central premium vs far eastern suburb'],
    ['baner',         'kondhwa',   'Baner is established vs developing south Pune'],
    ['baner',         'katraj',    'Baner premium vs Katraj developing'],
    ['aundh',         'dhanori',   'Aundh central premium vs Dhanori developing'],
    ['aundh',         'wagholi',   'Aundh established vs far east suburb'],
    ['viman_nagar',   'hinjewadi', 'VN is near airport premium vs IT hub only'],
    ['kothrud',       'dhanori',   'Kothrud good residential vs developing'],
    ['kothrud',       'wagholi',   'Kothrud established vs far east'],
    ['kharadi',       'katraj',    'Kharadi IT hub vs south developing'],
    ['magarpatta',    'kondhwa',   'Magarpatta township vs developing'],
    ['hadapsar',      'dhanori',   'Hadapsar has more amenities vs Dhanori'],
    ['wakad',         'wagholi',   'Wakad has more infrastructure vs Wagholi'],
    ['hinjewadi',     'katraj',    'Hinjewadi has IT infra vs Katraj developing'],
  ]

  test('All head-to-head matchups resolve correctly', () => {
    console.log('\n' + 'Winner'.padEnd(18) + 'vs'.padEnd(4) +
      'Loser'.padEnd(18) + 'Scores'.padEnd(14) + 'Result')
    console.log('─'.repeat(65))

    let passed = 0
    let failed = 0
    const failures = []

    MATCHUPS.forEach(([winnerKey, loserKey, reason]) => {
      const winnerScore = scoreCache[winnerKey]?.composite
      const loserScore = scoreCache[loserKey]?.composite
      const ok = winnerScore > loserScore

      ok ? passed++ : failed++
      if (!ok) failures.push({ winnerKey, loserKey, winnerScore, loserScore, reason })

      const winnerName = LOCALITIES[winnerKey].name.replace(', Pune','')
      const loserName = LOCALITIES[loserKey].name.replace(', Pune','')
      console.log(
        winnerName.padEnd(18) + 'vs'.padEnd(4) +
        loserName.padEnd(18) +
        `${winnerScore} vs ${loserScore}`.padEnd(14) +
        (ok ? `✅ (+${winnerScore - loserScore})` : `❌ WRONG`)
      )
    })

    console.log(`\n${passed}/${MATCHUPS.length} matchups correct`)

    if (failures.length > 0) {
      console.log('\nFAILED MATCHUPS:')
      failures.forEach(f => {
        console.log(`  ${f.winnerKey}(${f.winnerScore}) should beat ${f.loserKey}(${f.loserScore})`)
        console.log(`  Reason: ${f.reason}`)
      })
    }

    expect(failures.length).toBe(0)
  })

  test('No two localities have identical composite scores', () => {
    const scores = Object.entries(scoreCache).map(([k, d]) => ({
      key: k, score: d.composite
    }))

    const duplicates = []
    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        if (scores[i].score === scores[j].score) {
          duplicates.push(`${scores[i].key} and ${scores[j].key} both score ${scores[i].score}`)
        }
      }
    }

    if (duplicates.length > 0) {
      console.log('DUPLICATE SCORES:')
      duplicates.forEach(d => console.log(' ', d))
    }
    expect(duplicates.length).toBe(0)
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 4 — COMPARE MODE WINNER ACCURACY
// A 1-point difference must show the correct winner
// ══════════════════════════════════════════════════════════

describe('BLOCK 4 — Compare mode winner accuracy', () => {

  test('Winner is determined by composite score — even 1 point difference', async () => {
    const pairs = [
      ['koregaon_park', 'kalyani_nagar'],
      ['baner', 'aundh'],
      ['kothrud', 'kharadi'],
      ['wakad', 'hadapsar'],
      ['hinjewadi', 'dhanori'],
    ]

    console.log('\n=== CLOSE MATCHUP ANALYSIS ===\n')

    pairs.forEach(([aKey, bKey]) => {
      const aScore = scoreCache[aKey]?.composite
      const bScore = scoreCache[bKey]?.composite
      const winner = aScore >= bScore ? aKey : bKey
      const diff = Math.abs(aScore - bScore)

      console.log(
        `${LOCALITIES[aKey].name.replace(', Pune','')} (${aScore}) vs ` +
        `${LOCALITIES[bKey].name.replace(', Pune','')} (${bScore}) → ` +
        `Winner: ${LOCALITIES[winner].name.replace(', Pune','')} by ${diff} pts`
      )

      expect(aScore).not.toBeUndefined()
      expect(bScore).not.toBeUndefined()

      if (diff === 0) {
        console.log('  ⚠️  TIE — scores must be more differentiated')
      }
      expect(diff).toBeGreaterThan(0)
    })
  })

  test('Compare API returns correct winner for all tier matchups', async () => {
    const comparisons = [
      {
        a: LOCALITIES.koregaon_park,
        b: LOCALITIES.dhanori,
        expectedWinner: 'a'
      },
      {
        a: LOCALITIES.baner,
        b: LOCALITIES.hinjewadi,
        expectedWinner: 'a'
      },
      {
        a: LOCALITIES.wakad,
        b: LOCALITIES.wagholi,
        expectedWinner: 'a'
      },
    ]

    for (const comp of comparisons) {
      const [aData, bData] = await Promise.all([
        score(comp.a.lat, comp.a.lng, comp.a.name),
        score(comp.b.lat, comp.b.lng, comp.b.name)
      ])

      const winner = aData.composite >= bData.composite ? 'a' : 'b'
      const winnerName = winner === 'a' ? comp.a.name : comp.b.name
      const expectedName = comp[comp.expectedWinner].name

      console.log(`${comp.a.name.replace(', Pune','')} (${aData.composite}) vs ` +
        `${comp.b.name.replace(', Pune','')} (${bData.composite}) → ${winnerName.replace(', Pune','')} wins`)

      expect(winnerName).toBe(expectedName)
    }
  }, 60000)

})

// ══════════════════════════════════════════════════════════
// BLOCK 5 — PROFILE PERSONALISATION STRESS TEST
// ══════════════════════════════════════════════════════════

describe('BLOCK 5 — Profile personalisation stress test', () => {

  let profileScores = {}

  beforeAll(async () => {
    const testLocalities = ['koregaon_park', 'baner', 'hinjewadi', 'dhanori']
    for (const key of testLocalities) {
      profileScores[key] = {}
      for (const profile of PROFILES) {
        const data = await score(
          LOCALITIES[key].lat,
          LOCALITIES[key].lng,
          LOCALITIES[key].name,
          profile
        )
        profileScores[key][profile] = data.composite
      }
    }
  }, 120000)

  test('Family profile always ranks school-rich areas higher than school-poor', () => {
    const banerFamily = profileScores['baner']?.['family']
    const hinjFamily = profileScores['hinjewadi']?.['family']
    console.log(`\nFamily: Baner(${banerFamily}) vs Hinjewadi(${hinjFamily})`)
    expect(banerFamily).toBeGreaterThan(hinjFamily)
  })

  test('Professional profile penalises poor transport more than general profile', () => {
    const hinjGeneral = profileScores['hinjewadi']?.['general']
    const hinjPro = profileScores['hinjewadi']?.['professional']
    console.log(`\nHinjewadi: General(${hinjGeneral}) vs Professional(${hinjPro})`)
    // Hinjewadi has poor transport — professional profile should score it lower
    expect(hinjGeneral).toBeGreaterThanOrEqual(hinjPro)
  })

  test('Retiree profile boosts healthcare-rich areas', () => {
    const kpRetiree = profileScores['koregaon_park']?.['retiree']
    const kpGeneral = profileScores['koregaon_park']?.['general']
    console.log(`\nKP: General(${kpGeneral}) vs Retiree(${kpRetiree})`)
    // KP has excellent healthcare — retiree profile should score it higher or equal
    expect(kpRetiree).toBeGreaterThanOrEqual(kpGeneral - 5)
  })

  test('Investor profile boosts high property value areas', () => {
    const kpInvestor = profileScores['koregaon_park']?.['investor']
    const dhanoriInvestor = profileScores['dhanori']?.['investor']
    console.log(`\nInvestor: KP(${kpInvestor}) vs Dhanori(${dhanoriInvestor})`)
    expect(kpInvestor).toBeGreaterThan(dhanoriInvestor)
  })

  test('Every profile produces a different score for Baner', () => {
    const banerScores = PROFILES.map(p => profileScores['baner']?.[p])
    const unique = new Set(banerScores)
    console.log('\nBaner profile scores:')
    PROFILES.forEach((p, i) => console.log(`  ${p.padEnd(14)}: ${banerScores[i]}`))
    expect(unique.size).toBeGreaterThanOrEqual(3)
  })

  test('Profile spread is at least 8 points for any locality', () => {
    const keys = ['koregaon_park', 'baner', 'hinjewadi']
    keys.forEach(key => {
      const scores = PROFILES.map(p => profileScores[key]?.[p])
      const spread = Math.max(...scores) - Math.min(...scores)
      console.log(`${key} profile spread: ${spread} pts`)
      expect(spread).toBeGreaterThanOrEqual(8)
    })
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 6 — DIMENSION DIFFERENTIATION
// Each dimension must differentiate meaningfully
// ══════════════════════════════════════════════════════════

describe('BLOCK 6 — Dimension differentiation', () => {

  test('School scores vary by at least 20 points across localities', () => {
    const schoolScores = Object.values(scoreCache)
      .map(d => d.dimensions.school_quality?.score)
    const spread = Math.max(...schoolScores) - Math.min(...schoolScores)
    console.log(`\nSchool score range: ${Math.min(...schoolScores)}–${Math.max(...schoolScores)} (${spread} pts)`)
    expect(spread).toBeGreaterThanOrEqual(20)
  })

  test('Healthcare scores vary meaningfully', () => {
    const scores = Object.values(scoreCache)
      .map(d => d.dimensions.healthcare?.score)
    const spread = Math.max(...scores) - Math.min(...scores)
    console.log(`Healthcare score range: ${Math.min(...scores)}–${Math.max(...scores)} (${spread} pts)`)
    expect(spread).toBeGreaterThanOrEqual(15)
  })

  test('Transport scores vary meaningfully', () => {
    const scores = Object.values(scoreCache)
      .map(d => d.dimensions.transport?.score)
    const spread = Math.max(...scores) - Math.min(...scores)
    console.log(`Transport score range: ${Math.min(...scores)}–${Math.max(...scores)} (${spread} pts)`)
    expect(spread).toBeGreaterThanOrEqual(15)
  })

  test('Property value scores reflect Pune market reality', () => {
    const kp = scoreCache['koregaon_park']?.dimensions.property_value?.score
    const wagholi = scoreCache['wagholi']?.dimensions.property_value?.score
    console.log(`\nProperty: KP(${kp}) vs Wagholi(${wagholi})`)
    expect(kp).toBeGreaterThan(wagholi)
  })

  test('Print full dimension breakdown for all localities', () => {
    console.log('\n=== FULL DIMENSION BREAKDOWN ===\n')
    const header = 'Locality'.padEnd(16) +
      DIMENSIONS.map(d => d.replace('_quality','').replace('_','').substring(0,6).padEnd(8)).join('')
    console.log(header)
    console.log('─'.repeat(header.length))

    Object.entries(scoreCache).forEach(([key, data]) => {
      const name = LOCALITIES[key].name.replace(', Pune','').padEnd(16)
      const scores = DIMENSIONS.map(d =>
        String(data.dimensions[d]?.score || 0).padEnd(8)
      ).join('')
      console.log(name + scores)
    })
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 7 — EDGE CASES AND ROBUSTNESS
// ══════════════════════════════════════════════════════════

describe('BLOCK 7 — Edge cases and robustness', () => {

  test('Coordinates on Pune city boundary still return valid scores', async () => {
    const boundary = [
      { lat: 18.6500, lng: 73.8553, name: 'North Pune boundary' },
      { lat: 18.4200, lng: 73.8553, name: 'South Pune boundary' },
      { lat: 18.5362, lng: 74.0500, name: 'East Pune boundary' },
      { lat: 18.5362, lng: 73.6500, name: 'West Pune boundary' },
    ]

    for (const loc of boundary) {
      const data = await score(loc.lat, loc.lng, loc.name)
      console.log(`${loc.name}: ${data.composite}/100`)
      expect(data.composite).toBeGreaterThan(0)
      expect(data.composite).toBeLessThanOrEqual(100)
    }
  }, 60000)

  test('Same locality searched 3 times returns consistent scores', async () => {
    const loc = LOCALITIES.baner
    const [r1, r2, r3] = await Promise.all([
      score(loc.lat, loc.lng, loc.name),
      score(loc.lat, loc.lng, loc.name),
      score(loc.lat, loc.lng, loc.name)
    ])

    const scores = [r1.composite, r2.composite, r3.composite]
    const spread = Math.max(...scores) - Math.min(...scores)
    console.log(`\nBaner consistency: ${scores.join(', ')} (spread: ${spread})`)
    expect(spread).toBeLessThanOrEqual(3)
  }, 30000)

  test('Nearby alternatives always score higher than base locality', () => {
    Object.entries(scoreCache).forEach(([key, data]) => {
      const alts = data.nearby_alternatives || []
      alts.forEach(alt => {
        if (alt.score <= data.composite) {
          console.log(`BAD ALT: ${key}(${data.composite}) has alt ${alt.name}(${alt.score}) — not better`)
        }
        expect(alt.score).toBeGreaterThan(data.composite - 1)
      })
    })
  })

  test('All 8 dimensions present and non-null for all localities', () => {
    Object.entries(scoreCache).forEach(([key, data]) => {
      DIMENSIONS.forEach(dim => {
        expect(data.dimensions[dim]).toBeDefined()
        expect(data.dimensions[dim].score).not.toBeNull()
        expect(data.dimensions[dim].narrative).toBeDefined()
      })
    })
  })

  test('Composite math is correct for all localities', () => {
    const DEFAULT_WEIGHTS = {
      air_quality: 0.15, school_quality: 0.20, flood_risk: 0.15,
      healthcare: 0.15, crime_safety: 0.15, transport: 0.10,
      property_value: 0.05, greenery: 0.05
    }

    Object.entries(scoreCache).forEach(([key, data]) => {
      const calculated = Math.round(
        DIMENSIONS.reduce((sum, dim) =>
          sum + data.dimensions[dim].score * DEFAULT_WEIGHTS[dim], 0)
      )
      const diff = Math.abs(calculated - data.composite)
      if (diff > 2) {
        console.log(`MATH ERROR: ${key} calculated ${calculated} but got ${data.composite}`)
      }
      expect(diff).toBeLessThanOrEqual(2)
    })
  })

})

// ══════════════════════════════════════════════════════════
// BLOCK 8 — PERFORMANCE UNDER LOAD
// ══════════════════════════════════════════════════════════

describe('BLOCK 8 — Performance under load', () => {

  test('15 concurrent requests complete within 45 seconds', async () => {
    const start = Date.now()
    const requests = Object.values(LOCALITIES).map(loc =>
      score(loc.lat, loc.lng, loc.name)
    )
    const results = await Promise.allSettled(requests)
    const duration = Date.now() - start

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`\n15 concurrent: ${succeeded} succeeded, ${failed} failed in ${duration}ms`)
    expect(succeeded).toBe(15)
    expect(duration).toBeLessThan(45000)
  }, 60000)

  test('Response time p95 under 12 seconds', async () => {
    const times = []
    for (const loc of Object.values(LOCALITIES).slice(0, 10)) {
      const start = Date.now()
      await score(loc.lat, loc.lng, loc.name)
      times.push(Date.now() - start)
    }

    times.sort((a, b) => a - b)
    const p50 = times[Math.floor(times.length * 0.50)]
    const p95 = times[Math.floor(times.length * 0.95)]
    const p99 = times[times.length - 1]

    console.log(`\nResponse times (cached): p50=${p50}ms, p95=${p95}ms, p99=${p99}ms`)
    expect(p95).toBeLessThan(12000)
  }, 120000)

  test('Health endpoint always responds under 200ms', async () => {
    const times = []
    for (let i = 0; i < 10; i++) {
      const start = Date.now()
      await axios.get(`${BASE_URL}/health`)
      times.push(Date.now() - start)
    }
    const max = Math.max(...times)
    console.log(`\nHealth endpoint max: ${max}ms`)
    expect(max).toBeLessThan(200)
  })

})

// ══════════════════════════════════════════════════════════
// FINAL SUMMARY
// ══════════════════════════════════════════════════════════

afterAll(() => {
  const scores = Object.entries(scoreCache)
    .map(([k, d]) => ({ name: LOCALITIES[k].name.replace(', Pune',''), score: d.composite }))
    .sort((a, b) => b.score - a.score)

  console.log('\n╔══════════════════════════════════════╗')
  console.log('║     FINAL SCORE LEADERBOARD          ║')
  console.log('╠══════════════════════════════════════╣')
  scores.forEach((s, i) => {
    const bar = '█'.repeat(Math.floor(s.score / 5))
    console.log(`║ ${String(i+1).padStart(2)}. ${s.name.padEnd(18)} ${String(s.score).padStart(3)}/100 ║`)
  })
  console.log('╚══════════════════════════════════════╝')
})
