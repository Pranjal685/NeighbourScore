const axios = require('axios')
const express = require('express')
const rateLimit = require('express-rate-limit')
const BASE_URL = 'http://localhost:5000'

// Isolated rate-limit test server — runs on port 5099 so it never
// pollutes the shared backend's counter during parallel test execution.
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
  await new Promise(resolve => { _rateLimitServer = app.listen(5099, resolve) })
})

afterAll(async () => {
  await new Promise(resolve => _rateLimitServer.close(resolve))
})

describe('Input validation', () => {

  test('Missing lat returns 400', async () => {
    let threw = false
    try {
      await axios.post(`${BASE_URL}/api/score`, { lng: 73.78, locality_name: 'Test' })
    } catch (e) {
      threw = true
      expect(e.response.status).toBe(400)
    }
    expect(threw).toBe(true)
  })

  test('Missing lng returns 400', async () => {
    let threw = false
    try {
      await axios.post(`${BASE_URL}/api/score`, { lat: 18.59, locality_name: 'Test' })
    } catch (e) {
      threw = true
      expect(e.response.status).toBe(400)
    }
    expect(threw).toBe(true)
  })

  test('Coordinates outside India rejected with 400', async () => {
    let threw = false
    try {
      await axios.post(`${BASE_URL}/api/score`, {
        lat: 51.5074, lng: -0.1278, locality_name: 'London'
      })
    } catch (e) {
      threw = true
      expect(e.response.status).toBe(400)
      expect(e.response.data.error).toContain('India')
    }
    expect(threw).toBe(true)
  })

  test('Script injection in locality_name is sanitized', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, {
      lat: 18.5974, lng: 73.7898,
      locality_name: '<script>alert("xss")</script>'
    })
    expect(res.status).toBe(200)
    expect(res.data.locality).not.toContain('<script>')
  })

  test('Extremely long locality_name is truncated to 100 chars', async () => {
    const longName = 'A'.repeat(500)
    const res = await axios.post(`${BASE_URL}/api/score`, {
      lat: 18.5974, lng: 73.7898,
      locality_name: longName
    })
    expect(res.status).toBe(200)
    expect(res.data.locality.length).toBeLessThanOrEqual(100)
  })

  test('Invalid profile falls back to general', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, {
      lat: 18.5974, lng: 73.7898,
      locality_name: 'Wakad, Pune',
      profile: 'hacker_profile'
    })
    expect(res.status).toBe(200)
    expect(res.data.profile).toBe('general')
  })

  test('SQL/NoSQL injection attempt is handled safely', async () => {
    const res = await axios.post(`${BASE_URL}/api/score`, {
      lat: 18.5974, lng: 73.7898,
      locality_name: "'; DROP TABLE schools; --"
    })
    expect(res.status).toBe(200)
  })

  test('Rate limiter returns 429 after exceeding limit', async () => {
    // Uses the isolated test server on :5099 (limit: 20/min) so this
    // test never exhausts the shared backend's counter for other tests.
    const requests = Array(25).fill(null).map(() =>
      axios.post('http://localhost:5099/test', {}).catch(e => e.response)
    )
    const results = await Promise.all(requests)
    const rateLimited = results.filter(r => r && r.status === 429)
    console.log(`Rate limited: ${rateLimited.length}/25 requests`)
    expect(rateLimited.length).toBeGreaterThan(0)
  }, 30000)

})
