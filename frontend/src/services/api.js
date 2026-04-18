const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Timeout (ms) for score API — Cloud Run cold start can take ~10s, pipeline ~15s
const SCORE_TIMEOUT_MS = 55000;

function safeGtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export async function getScore(lat, lng, locality_name, profile = 'general') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCORE_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, locality_name, profile }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `Score API error ${response.status}`);
    }

    const data = await response.json();

    // GA4: track successful locality analysis
    safeGtag('event', 'locality_analyzed', {
      locality_name,
      composite_score: data.composite,
      profile,
    });

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server is starting up — please try again in a few seconds.');
    }
    throw err;
  }
}

export async function getReportBySlug(slug) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCORE_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/api/report/${slug}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Report not found');
      throw new Error('Failed to fetch shared report');
    }
    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}
