/**
 * Hardcoded Pune locality property price map for demo.
 */
const PUNE_LOCALITIES = {
  'wakad':            { price_per_sqft: 8200,  trend_12m_pct: 8  },
  'baner':            { price_per_sqft: 9500,  trend_12m_pct: 11 },
  'kothrud':          { price_per_sqft: 10200, trend_12m_pct: 6  },
  'hinjewadi':        { price_per_sqft: 7800,  trend_12m_pct: 9  },
  'viman nagar':      { price_per_sqft: 10800, trend_12m_pct: 7  },
  'koregaon park':    { price_per_sqft: 14000, trend_12m_pct: 5  },
  'hadapsar':         { price_per_sqft: 7500,  trend_12m_pct: 10 },
  'pimple saudagar':  { price_per_sqft: 7900,  trend_12m_pct: 8  },
  'aundh':            { price_per_sqft: 11000, trend_12m_pct: 6  },
  'kharadi':          { price_per_sqft: 8800,  trend_12m_pct: 12 },
  'magarpatta':       { price_per_sqft: 9200,  trend_12m_pct: 7  },
  'kalyani nagar':    { price_per_sqft: 11500, trend_12m_pct: 5  },
  'pune':             { price_per_sqft: 7500,  trend_12m_pct: 5  },
};

/**
 * Map trend percentage to a 0-100 score.
 */
function trendToScore(trend) {
  if (trend > 10) return 90;
  if (trend >= 5) return 75;
  if (trend >= 0) return 60;
  return 40;
}

/**
 * Match locality name against the hardcoded price map.
 */
async function getPropertyScore(lat, lng, localityName) {
  try {
    const search = (localityName || '').toLowerCase();
    let matched = null;
    let matchedKey = null;

    // Check if any key from the map is contained in the locality name
    for (const [key, val] of Object.entries(PUNE_LOCALITIES)) {
      if (search.includes(key)) {
        matched = val;
        matchedKey = key;
        break;
      }
    }

    if (!matched) {
      // Default fallback
      return {
        score: 60,
        raw: {
          locality_matched: null,
          price_per_sqft: 7500,
          trend_12m_pct: 5,
          source: 'aggregated_2024',
        },
      };
    }

    const score = Math.min(100, Math.max(0, trendToScore(matched.trend_12m_pct)));

    return {
      score,
      raw: {
        locality_matched: matchedKey,
        price_per_sqft: matched.price_per_sqft,
        trend_12m_pct: matched.trend_12m_pct,
        source: 'aggregated_2024',
      },
    };
  } catch (err) {
    // This service should never throw
    return {
      score: 60,
      raw: { locality_matched: null, price_per_sqft: 7500, trend_12m_pct: 5, source: 'aggregated_2024' },
    };
  }
}

module.exports = { getPropertyScore };
