const axios = require('axios');

/**
 * Fetch recent crime/safety news for a locality using GNews API.
 * GNews supports country=in on the free tier — unlike NewsAPI whose
 * `domains` filter is paid-only. Results are pre-filtered to India,
 * then further filtered to ensure Pune/Maharashtra relevance.
 *
 * Returns [] when fewer than 2 relevant articles found — better to
 * show nothing than to show unrelated content.
 */
async function getCrimeNews(district, localityName) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];

    const districtName = district || 'Pune';

    // 90-day window
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    // GNews `from` param format: YYYY-MM-DDTHH:MM:SSZ
    const from = ninetyDaysAgo.toISOString().replace('.000', '');

    // Broad enough to catch results but scoped to Pune/Maharashtra crime topics
    const q = `Pune crime OR Maharashtra crime OR Pune police OR Pune safety OR Pune theft OR Pune robbery`;

    const params = {
      q,
      lang:    'en',
      country: 'in',      // free-tier supported — restricts to Indian sources
      max:     10,
      sortby:  'publishedAt',
      from,
      token:   apiKey,
    };

    let data;
    // GNews free tier: 1 req/sec rate limit. When hit, articles=[] but totalArticles>0.
    // Retry once after a 1.5s delay before giving up.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await axios.get('https://gnews.io/api/v4/search', { params, timeout: 8000 });
      data = res.data;
      if (data.articles && data.articles.length > 0) break;
      if (attempt === 1 && data.totalArticles > 0) {
        // Rate limited — wait and retry
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!data || !data.articles || !Array.isArray(data.articles)) return [];

    // Secondary content filter — ensure article actually mentions
    // Pune, Maharashtra, or the specific district
    const lowerDistrict = districtName.toLowerCase();
    const relevant = data.articles.filter(a => {
      const title = (a.title       || '').toLowerCase();
      const desc  = (a.description || '').toLowerCase();
      return (
        title.includes('pune') ||
        title.includes('maharashtra') ||
        title.includes(lowerDistrict) ||
        desc.includes('pune') ||
        desc.includes('maharashtra') ||
        desc.includes(lowerDistrict)
      );
    });

    if (relevant.length < 2) return [];

    return relevant.slice(0, 5).map(a => ({
      title:       a.title              || '',
      description: a.description        || '',
      url:         a.url                || '',
      publishedAt: a.publishedAt        || '',
      source:      a.source?.name       || 'Unknown',
    }));
  } catch (err) {
    console.warn('GNews API failed:', err.message);
    return [];
  }
}

module.exports = { getCrimeNews };
