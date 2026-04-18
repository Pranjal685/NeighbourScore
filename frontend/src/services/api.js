const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function safeGtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export async function getScore(lat, lng, locality_name, profile = 'general') {
  const response = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, locality_name, profile })
  });
  if (!response.ok) throw new Error('Score API failed');
  const data = await response.json();

  // GA4: track successful locality analysis
  safeGtag('event', 'locality_analyzed', {
    locality_name,
    composite_score: data.composite,
    profile,
  });

  return data;
}

export async function getReportBySlug(slug) {
  const response = await fetch(`${API_URL}/api/report/${slug}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Report not found');
    throw new Error('Failed to fetch shared report');
  }
  return response.json();
}
