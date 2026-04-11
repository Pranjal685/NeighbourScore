const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function getScore(lat, lng, locality_name, profile = 'general') {
  const response = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, locality_name, profile })
  });
  if (!response.ok) throw new Error('Score API failed');
  return response.json();
}
