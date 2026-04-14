const axios = require('axios');

// ─── In-memory cache ────────────────────────────────────────────────────────
// Keyed by `${district}_${localityName}`. 10-minute TTL.
// Avoids GNews free-tier rate limits (1 req/sec) during rapid searches
// and judge demos — first search populates, subsequent searches hit cache.
const newsCache = {};
const NEWS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const entry = newsCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > NEWS_CACHE_TTL_MS) {
    delete newsCache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  newsCache[key] = { data, timestamp: Date.now() };
}

// ─── GNews API call ─────────────────────────────────────────────────────────
/**
 * Fetch raw articles from GNews for a given district.
 * Returns { articles, totalArticles } — articles may be empty if rate-limited.
 */
async function fetchGNews(district) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return { articles: [], totalArticles: 0 };

  const districtName = district || 'Pune';

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const from = ninetyDaysAgo.toISOString().replace('.000', '');

  const q = `Pune crime OR Maharashtra crime OR Pune police OR Pune safety OR Pune theft OR Pune robbery OR ${districtName} crime`;

  const { data } = await axios.get('https://gnews.io/api/v4/search', {
    params: {
      q,
      lang:    'en',
      country: 'in',
      max:     10,
      sortby:  'publishedAt',
      from,
      token:   apiKey,
    },
    timeout: 8000,
  });

  return {
    articles:      Array.isArray(data?.articles) ? data.articles : [],
    totalArticles: data?.totalArticles || 0,
  };
}

// ─── Filtering & shaping ────────────────────────────────────────────────────
/**
 * Keep only articles that mention Pune/Maharashtra/district, published
 * within the last 90 days. Returns [] if fewer than 2 pass — better to
 * show nothing than irrelevant content.
 */
function filterAndReturn(articles, districtName) {
  const lowerDistrict = (districtName || 'pune').toLowerCase();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const relevant = articles.filter(a => {
    const title = (a.title       || '').toLowerCase();
    const desc  = (a.description || '').toLowerCase();
    const mentionsRegion = (
      title.includes('pune') ||
      title.includes('maharashtra') ||
      title.includes(lowerDistrict) ||
      desc.includes('pune') ||
      desc.includes('maharashtra') ||
      desc.includes(lowerDistrict)
    );
    const recent = a.publishedAt && new Date(a.publishedAt) > ninetyDaysAgo;
    return mentionsRegion && recent;
  });

  if (relevant.length < 2) return [];

  return relevant.slice(0, 5).map(a => ({
    title:       a.title       || '',
    description: a.description || '',
    url:         a.url         || '',
    publishedAt: a.publishedAt || '',
    source:      a.source?.name || 'Unknown',
  }));
}

// ─── Public entry point ─────────────────────────────────────────────────────
/**
 * Fetch recent crime/safety news for a district/locality.
 *
 * Strategy:
 *   1. Check 10-min in-memory cache — return instantly if hit
 *   2. Call GNews API
 *   3. If GNews returns articles=[] but totalArticles>0 (rate limited),
 *      wait 1.5s and retry once
 *   4. Filter to Pune/Maharashtra relevance, cache, and return
 */
async function getCrimeNews(district, localityName) {
  try {
    const districtName = district || 'Pune';
    const cacheKey = `${districtName}_${localityName || ''}`;

    // 1. Cache hit
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[newsService] Cache hit for ${cacheKey} (${cached.length} articles)`);
      return cached;
    }

    // 2. First attempt
    let result = await fetchGNews(districtName);

    // 3. Rate-limit retry
    if (result.totalArticles > 0 && result.articles.length === 0) {
      console.log('[newsService] Rate limited, retrying in 1.5s...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      result = await fetchGNews(districtName);
    }

    // 4. Filter, cache, return
    const filtered = filterAndReturn(result.articles, districtName);
    setCached(cacheKey, filtered);
    console.log(`[newsService] Fetched ${result.articles.length} raw, ${filtered.length} relevant for ${cacheKey}`);
    return filtered;
  } catch (err) {
    console.warn('[newsService] GNews failed:', err.message);
    return [];
  }
}

module.exports = { getCrimeNews };
