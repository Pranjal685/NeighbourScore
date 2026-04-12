const axios = require('axios');

/**
 * Fetch recent crime/safety news for a district and locality from NewsAPI.
 * Returns an empty array if the API key is missing or the call fails.
 */
async function getCrimeNews(district, localityName) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const from = thirtyDaysAgo.toISOString().split('T')[0];

    const q = `"${localityName}" OR "${district}" crime OR safety OR police`;

    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 5,
        from,
        apiKey,
      },
      timeout: 8000,
    });

    if (!data.articles || !Array.isArray(data.articles)) return [];

    return data.articles.slice(0, 5).map(a => ({
      title: a.title || '',
      description: a.description || '',
      url: a.url || '',
      publishedAt: a.publishedAt || '',
      source: a.source?.name || 'Unknown',
    }));
  } catch (err) {
    console.warn('NewsAPI failed:', err.message);
    return [];
  }
}

module.exports = { getCrimeNews };
