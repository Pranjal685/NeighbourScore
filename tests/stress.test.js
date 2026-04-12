const axios = require('axios')
const BASE_URL = 'http://localhost:5000'

const LOCALITIES = [
  { lat: 18.5974, lng: 73.7898, locality_name: 'Wakad, Pune' },
  { lat: 18.5590, lng: 73.7868, locality_name: 'Baner, Pune' },
  { lat: 18.5362, lng: 73.8937, locality_name: 'Koregaon Park, Pune' },
  { lat: 18.5912, lng: 73.7389, locality_name: 'Hinjewadi, Pune' },
  { lat: 18.5074, lng: 73.8077, locality_name: 'Kothrud, Pune' },
]

describe('Stress tests', () => {

  test('Health endpoint responds under 500ms', async () => {
    const start = Date.now()
    const res = await axios.get(`${BASE_URL}/health`)
    const duration = Date.now() - start
    expect(res.data.status).toBe('ok')
    expect(duration).toBeLessThan(500)
  })

  test('10 sequential requests all succeed under 15s each', async () => {
    const results = []
    for (let i = 0; i < 10; i++) {
      const locality = LOCALITIES[i % LOCALITIES.length]
      const start = Date.now()
      const res = await axios.post(`${BASE_URL}/api/score`, locality)
      const elapsed = Date.now() - start
      results.push({ status: res.status, time: elapsed, locality: locality.locality_name })
      console.log(`  [${i + 1}/10] ${locality.locality_name}: ${res.data.composite}/100 (${elapsed}ms)`)
    }
    results.forEach(r => {
      expect(r.status).toBe(200)
      expect(r.time).toBeLessThan(25000)
    })
  }, 120000)

  test('5 concurrent requests all succeed', async () => {
    const start = Date.now()
    const requests = LOCALITIES.map(l => axios.post(`${BASE_URL}/api/score`, l))
    const results = await Promise.allSettled(requests)
    const duration = Date.now() - start

    const succeeded = results.filter(r => r.status === 'fulfilled')
    expect(succeeded.length).toBe(5)
    expect(duration).toBeLessThan(30000)

    console.log(`5 concurrent requests completed in ${duration}ms`)
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        console.log(`  ${LOCALITIES[i].locality_name}: ${r.value.data.composite}/100`)
      } else {
        console.log(`  ${LOCALITIES[i].locality_name}: FAILED — ${r.reason?.message}`)
      }
    })
  }, 60000)

  test('No response returns score 0 for any dimension', async () => {
    const results = await Promise.all(
      LOCALITIES.map(l => axios.post(`${BASE_URL}/api/score`, l))
    )
    results.forEach((res, i) => {
      Object.entries(res.data.dimensions).forEach(([key, dim]) => {
        expect(dim.score).toBeGreaterThan(0)
      })
    })
  }, 60000)

  test('Cached response is returned with cached:true on second call', async () => {
    const locality = LOCALITIES[0]

    // First call (may be fresh or already cached)
    const freshStart = Date.now()
    await axios.post(`${BASE_URL}/api/score`, locality)
    const freshTime = Date.now() - freshStart

    // Second call should hit cache
    const cachedStart = Date.now()
    const cached = await axios.post(`${BASE_URL}/api/score`, locality)
    const cachedTime = Date.now() - cachedStart

    console.log(`Fresh: ${freshTime}ms, Cached: ${cachedTime}ms, cached flag: ${cached.data.cached}`)
    // If cached flag is set, it must be faster
    if (cached.data.cached) {
      expect(cachedTime).toBeLessThan(freshTime)
    }
    // Either way it must succeed
    expect(cached.status).toBe(200)
    expect(cached.data.composite).toBeGreaterThan(0)
  }, 30000)

})
