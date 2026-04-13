const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Hardcoded Pune locality property price map — used as fallback.
 */
const PUNE_LOCALITIES = {
  'koregaon park':    { price_per_sqft: 14000, trend_12m_pct: 5  },
  'kalyani nagar':    { price_per_sqft: 11500, trend_12m_pct: 5  },
  'baner':            { price_per_sqft: 9500,  trend_12m_pct: 11 },
  'aundh':            { price_per_sqft: 11000, trend_12m_pct: 6  },
  'viman nagar':      { price_per_sqft: 10800, trend_12m_pct: 7  },
  'kothrud':          { price_per_sqft: 10200, trend_12m_pct: 6  },
  'kharadi':          { price_per_sqft: 8800,  trend_12m_pct: 12 },
  'wakad':            { price_per_sqft: 8200,  trend_12m_pct: 8  },
  'magarpatta':       { price_per_sqft: 9200,  trend_12m_pct: 7  },
  'hadapsar':         { price_per_sqft: 7500,  trend_12m_pct: 10 },
  'hinjewadi':        { price_per_sqft: 7800,  trend_12m_pct: 9  },
  'pimple saudagar':  { price_per_sqft: 7900,  trend_12m_pct: 8  },
  'dhanori':          { price_per_sqft: 6000,  trend_12m_pct: 3  },
  'kondhwa':          { price_per_sqft: 5800,  trend_12m_pct: 3  },
  'wagholi':          { price_per_sqft: 5500,  trend_12m_pct: 2  },
  'katraj':           { price_per_sqft: 5200,  trend_12m_pct: 2  },
  'nibm':             { price_per_sqft: 6500,  trend_12m_pct: 4  },
  'chinchwad':        { price_per_sqft: 6800,  trend_12m_pct: 4  },
  // Generic entries last
  'pimpri':           { price_per_sqft: 6500,  trend_12m_pct: 4  },
  'pune':             { price_per_sqft: 7500,  trend_12m_pct: 5  },
};

/**
 * Map trend percentage to a 0-100 score.
 */
function trendToScore(trend) {
  if (trend > 10) return 100;
  if (trend >= 5) return 75;
  if (trend >= 0) return 60;
  return 40;
}

/**
 * Try to get live property data from Gemini with Google Search grounding.
 * Returns null if it fails or returns invalid data.
 */
async function tryGeminiSearch(localityName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }],
    });

    const prompt = `What is the current property price per square foot in ${localityName} in 2026? Give me the average price in INR per sqft and the approximate 12-month price appreciation percentage. Respond ONLY in this JSON format with no other text: {"price_per_sqft": number, "trend_12m_pct": number, "source": "string"}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.response.text();

    // Extract JSON from the response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.price_per_sqft === 'number' &&
      parsed.price_per_sqft > 0 &&
      typeof parsed.trend_12m_pct === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Gemini search grounding failed for property:', err.message);
    return null;
  }
}

/**
 * Get property score — tries Gemini search grounding first, falls back to hardcoded map.
 */
async function getPropertyScore(lat, lng, localityName) {
  const search = (localityName || '').toLowerCase();

  // Step 1: Check hardcoded map first for known Pune localities (deterministic)
  for (const [key, val] of Object.entries(PUNE_LOCALITIES)) {
    if (search.includes(key)) {
      const score = Math.min(100, Math.max(0, trendToScore(val.trend_12m_pct)));
      return {
        score,
        raw: {
          locality_matched: key,
          price_per_sqft: val.price_per_sqft,
          trend_12m_pct: val.trend_12m_pct,
          source: 'aggregated_2024',
          data_freshness: 'cached',
        },
      };
    }
  }

  // Step 2: Try Gemini with search grounding for unknown localities
  const geminiData = await tryGeminiSearch(localityName);
  if (geminiData) {
    const score = Math.min(100, Math.max(0, trendToScore(geminiData.trend_12m_pct)));
    return {
      score,
      raw: {
        locality_matched: localityName,
        price_per_sqft: geminiData.price_per_sqft,
        trend_12m_pct: geminiData.trend_12m_pct,
        source: 'gemini_search_2026',
        data_freshness: 'live',
      },
    };
  }

  // Step 3: Default fallback
  return {
    score: 60,
    raw: {
      locality_matched: null,
      price_per_sqft: 7500,
      trend_12m_pct: 5,
      source: 'aggregated_2024',
      data_freshness: 'cached',
    },
  };
}

module.exports = { getPropertyScore };
