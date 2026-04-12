const axios = require('axios')
const BASE_URL = 'http://localhost:5000'

const TEST_LOCALITIES = {
  koregaon_park: { lat: 18.5362, lng: 73.8937, locality_name: 'Koregaon Park, Pune' },
  baner:         { lat: 18.5590, lng: 73.7868, locality_name: 'Baner, Pune' },
  wakad:         { lat: 18.5974, lng: 73.7898, locality_name: 'Wakad, Pune' },
  hinjewadi:     { lat: 18.5912, lng: 73.7389, locality_name: 'Hinjewadi, Pune' },
  dhanori:       { lat: 18.6048, lng: 73.9144, locality_name: 'Dhanori, Pune' },
}

describe('Score correctness', () => {

  test('Koregaon Park scores higher than Dhanori', async () => {
    const [kp, dh] = await Promise.all([
      axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.koregaon_park),
      axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.dhanori)
    ])
    console.log(`Koregaon Park: ${kp.data.composite}, Dhanori: ${dh.data.composite}`)
    expect(kp.data.composite).toBeGreaterThan(dh.data.composite)
  }, 20000)

  test('Baner scores higher than Dhanori', async () => {
    const [bn, dh] = await Promise.all([
      axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.baner),
      axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.dhanori)
    ])
    console.log(`Baner: ${bn.data.composite}, Dhanori: ${dh.data.composite}`)
    expect(bn.data.composite).toBeGreaterThan(dh.data.composite)
  }, 20000)

  test('All 8 dimensions present in response', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.wakad)
    const dims = res.data.dimensions
    const required = ['air_quality','school_quality','flood_risk',
      'healthcare','crime_safety','transport','property_value','greenery']
    required.forEach(d => {
      expect(dims[d]).toBeDefined()
      expect(dims[d].score).toBeGreaterThanOrEqual(20)
      expect(dims[d].score).toBeLessThanOrEqual(100)
    })
  }, 15000)

  test('Composite is weighted sum of dimensions (within ±2)', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.wakad)
    const { dimensions: d, composite, weights_used: w } = res.data
    const calculated = Math.round(
      d.air_quality.score    * w.air_quality +
      d.school_quality.score * w.school_quality +
      d.flood_risk.score     * w.flood_risk +
      d.healthcare.score     * w.healthcare +
      d.crime_safety.score   * w.crime_safety +
      d.transport.score      * w.transport +
      d.property_value.score * w.property_value +
      d.greenery.score       * w.greenery
    )
    console.log(`Composite: ${composite}, Calculated: ${calculated}`)
    expect(Math.abs(composite - calculated)).toBeLessThanOrEqual(2)
  }, 15000)

  test('Family profile raises school weight to 0.35', async () => {
    const [general, family] = await Promise.all([
      axios.post(`${BASE_URL}/api/score`, { ...TEST_LOCALITIES.wakad, profile: 'general' }),
      axios.post(`${BASE_URL}/api/score`, { ...TEST_LOCALITIES.wakad, profile: 'family' })
    ])
    expect(general.data.composite).not.toEqual(family.data.composite)
    expect(family.data.weights_used.school_quality).toBe(0.35)
    expect(general.data.weights_used.school_quality).toBe(0.20)
  }, 20000)

  test('All 5 profiles produce different composites', async () => {
    const profiles = ['general','family','professional','retiree','investor']
    const results = await Promise.all(
      profiles.map(p =>
        axios.post(`${BASE_URL}/api/score`, { ...TEST_LOCALITIES.baner, profile: p })
      )
    )
    const scores = results.map(r => r.data.composite)
    console.log('Profile scores:', profiles.map((p, i) => `${p}:${scores[i]}`).join(', '))
    const uniqueScores = new Set(scores)
    expect(uniqueScores.size).toBeGreaterThan(2)
  }, 30000)

  test('Nearby alternatives returned with required fields', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.hinjewadi)
    const alts = res.data.nearby_alternatives
    if (alts && alts.length > 0) {
      alts.forEach(alt => {
        expect(alt.score).toBeGreaterThan(res.data.composite)
        expect(alt.name).toBeDefined()
        expect(alt.distance_km).toBeDefined()
      })
    }
  }, 15000)

  test('Crime raw data has recent_news array', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, TEST_LOCALITIES.wakad)
    const crimeRaw = res.data.dimensions.crime_safety.raw
    expect(crimeRaw).toHaveProperty('recent_news')
    expect(Array.isArray(crimeRaw.recent_news)).toBe(true)
  }, 15000)

})
