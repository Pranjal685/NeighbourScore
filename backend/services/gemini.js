const { GoogleGenerativeAI } = require('@google/generative-ai');

const DIMENSION_KEYS = [
  'air_quality', 'school_quality', 'flood_risk', 'healthcare',
  'crime_safety', 'transport', 'property_value', 'greenery',
];

const PROFILE_LABELS = {
  family: 'a family with young children',
  professional: 'a working professional',
  retiree: 'a retiree or senior',
  investor: 'a property investor',
  general: 'a homebuyer',
};

const MUMBAI_BBOX = { minLat: 18.85, maxLat: 19.35, minLng: 72.75, maxLng: 73.10 };

function detectCity(lat, lng) {
  if (lat != null && lng != null &&
      lat >= MUMBAI_BBOX.minLat && lat <= MUMBAI_BBOX.maxLat &&
      lng >= MUMBAI_BBOX.minLng && lng <= MUMBAI_BBOX.maxLng) {
    return 'mumbai';
  }
  return 'pune';
}

const CITY_CONTEXT = {
  mumbai: {
    cityName: 'Mumbai',
    transport: 'Mumbai local trains, BEST buses, and Metro lines',
    floodContext: 'Arabian Sea coastal flooding and Mithi River overflow',
    crimeDistrict: 'Mumbai City/Suburban district',
    avgPriceLabel: '₹15,000/sqft',
    monsoon: 'June–September (heavy coastal rainfall and waterlogging risk)',
    schoolBoards: 'ICSE/SSC/CBSE/International boards',
  },
  pune: {
    cityName: 'Pune',
    transport: 'PMPML buses',
    floodContext: 'Mula-Mutha river flooding',
    crimeDistrict: 'Pune district',
    avgPriceLabel: '₹7,500/sqft',
    monsoon: 'June–September (better air quality, Oct–Feb worse due to crop burning)',
    schoolBoards: 'CBSE board',
  },
};

/**
 * Rich, data-aware fallback narratives per dimension.
 */
function fallbackNarrative(dimensionKey, score, localityName, raw = {}, cityCtx) {
  const ctx = cityCtx || CITY_CONTEXT.pune;
  switch (dimensionKey) {
    case 'air_quality': {
      const aqi = raw.aqi || '—';
      if (score >= 80) return `Air quality here is good with AQI in the satisfactory range${aqi !== '—' ? ` (AQI ${aqi})` : ''}. ${ctx.cityName}'s air is cleanest during ${ctx.monsoon}.`;
      if (score >= 60) return `Air quality is moderate with AQI around ${aqi}. November to February see higher pollution — keep this in mind if you have young children or respiratory conditions.`;
      return `Air quality is poor in this area with AQI above 150${aqi !== '—' ? ` (recorded ${aqi})` : ''}. Consider this carefully if any family member has respiratory conditions.`;
    }
    case 'school_quality': {
      const count = raw.count != null ? raw.count : '—';
      const sourceLabel = raw.source === 'google_places' ? 'schools' : 'CBSE schools';
      if (score >= 80) return `${count} ${sourceLabel} found within 3km. Good school density — your children will have multiple ${ctx.schoolBoards} options within a short commute.`;
      if (score >= 60) return `${count} ${sourceLabel} within 3km radius. Adequate coverage for school-going children, though you may want to verify specific school ratings before deciding.`;
      return `Fewer than 3 ${sourceLabel} found within 3km. Families with school-going children should thoroughly research specific school options before committing to this locality.`;
    }
    case 'healthcare': {
      const count = raw.count != null ? raw.count : '—';
      const first = raw.hospitals?.[0]?.name || null;
      if (score >= 80) return `${count} hospitals found within 3km${first ? `, including ${first}` : ''}. Excellent emergency medical access — day-to-day healthcare needs are well covered for your family.`;
      if (score >= 60) return `${count} hospitals within 3km radius. Adequate healthcare access for routine needs, though major specialty hospitals may require travelling a bit further.`;
      return `Limited hospital access in this area with fewer than 3 hospitals within 3km. Factor in travel time to the nearest major hospital — this is especially important for seniors or families with young children.`;
    }
    case 'crime_safety': {
      const rate = raw.crime_rate ? Math.round(raw.crime_rate) : '—';
      if (score >= 70) return `${ctx.crimeDistrict} recorded ${rate} crimes per 100,000 population in 2023 — below the Maharashtra state average. This locality is generally considered safe for families.`;
      if (score >= 55) return `Crime rate is ${rate} per 100,000 — around the ${ctx.crimeDistrict} average. Standard urban precautions apply, as with any city neighbourhood.`;
      return `Crime rate of ${rate} per 100,000 is above the Maharashtra average. Note this is district-level data — actual locality safety may vary, so verify with locals before deciding.`;
    }
    case 'transport': {
      const count = raw.count != null ? raw.count : '—';
      if (score >= 80) return `${count} transit stops within 500m. Excellent public transport connectivity via ${ctx.transport} — daily commuting without a personal vehicle is very practical from this location.`;
      if (score >= 60) return `${count} transit stops within 500m. Decent ${ctx.transport} coverage for most routes, though peak hour frequency can be limited on some corridors.`;
      return `Limited transit connectivity with fewer than 3 stops within 500m. A personal vehicle is strongly recommended — ${ctx.transport} coverage is sparse in this area.`;
    }
    case 'property_value': {
      const price = raw.price_per_sqft ? `₹${raw.price_per_sqft.toLocaleString('en-IN')}` : '—';
      const trend = raw.trend_12m_pct != null ? raw.trend_12m_pct : '—';
      if (score >= 80) return `Property prices are around ${price}/sqft with ${trend > 0 ? '+' : ''}${trend}% appreciation in 12 months — above ${ctx.cityName}'s city average of ${ctx.avgPriceLabel}. This area shows strong investment potential.`;
      if (score >= 60) return `Property at approximately ${price}/sqft with ${trend}% annual appreciation — broadly in line with ${ctx.cityName}'s overall market performance of ${ctx.avgPriceLabel} average.`;
      return `Property prices around ${price}/sqft with modest ${trend}% appreciation. More affordable than central ${ctx.cityName} areas, but with lower near-term capital appreciation prospects.`;
    }
    case 'greenery': {
      const count = raw.count != null ? raw.count : '—';
      if (score >= 80) return `${count} parks within 1km. Above average greenery for ${ctx.cityName} — your family will have ample green spaces for daily walks, jogging, and children's outdoor play.`;
      if (score >= 60) return `${count} parks within 1km. Adequate green cover for a ${ctx.cityName} neighbourhood — better than the dense city core but less than dedicated green residential zones.`;
      return `Limited parks within 1km. Green cover is below the ${ctx.cityName} average — factor this in if outdoor activity, children's play, or morning walks are important to your lifestyle.`;
    }
    case 'flood_risk': {
      if (raw.in_flood_zone) return `This locality falls in an NDMA classified flood hazard zone. During heavy monsoon rainfall, localised flooding due to ${ctx.floodContext} is possible — verify ground floor risk before buying.`;
      return `Not in any NDMA flood hazard zone. This area has no recorded flood risk classification — safe from the ${ctx.floodContext} that affects several low-lying ${ctx.cityName} localities.`;
    }
    default: {
      if (score >= 80) return `This dimension scores well for ${localityName} — above the ${ctx.cityName} average. A positive signal for most homebuyers.`;
      if (score >= 60) return `This dimension scores moderately for ${localityName}, around the ${ctx.cityName} average. Worth factoring into your final decision.`;
      return `This dimension scores below average for ${localityName}. Worth investigating further before committing to this location.`;
    }
  }
}

/**
 * Call Gemini for a single dimension. Retries once on 429.
 */
async function generateOneDimension(model, dimensionKey, score, raw, localityName, profileLabel, cityCtx) {
  const ctx = cityCtx || CITY_CONTEXT.pune;
  const prompt = `You are NeighbourScore AI, a neighborhood intelligence assistant for Indian homebuyers in ${ctx.cityName}, Maharashtra.

Generate ONE 2-sentence narrative for the ${dimensionKey.replace(/_/g, ' ')} dimension for ${localityName}.

Context about this person: ${profileLabel}

Data: score ${score}/100, raw data: ${JSON.stringify(raw)}

Rules for your response:
1. Use the actual numbers from the raw data
2. Mention specific ${ctx.cityName} context where relevant:
   - Air quality: mention ${ctx.cityName}'s monsoon season (${ctx.monsoon})
   - Schools: mention ${ctx.schoolBoards} specifically, distance in km
   - Flood: mention ${ctx.floodContext} if relevant, monsoon risk
   - Healthcare: mention specific hospital names from raw data if available
   - Crime: compare to Maharashtra average specifically, reference ${ctx.crimeDistrict}
   - Transport: mention ${ctx.transport} specifically
   - Property: mention ₹/sqft and compare to ${ctx.cityName} average (approx ${ctx.avgPriceLabel})
   - Greenery: mention parks by name if available in raw data
3. Write for a family making a real housing decision
4. Be specific, practical, and honest about limitations
5. Do NOT use phrases like "scores excellently" or "well above average" — use specific numbers instead
6. Maximum 2 sentences, plain conversational English

Respond with ONLY the narrative text, no JSON, no labels.`;

  const tryGenerate = async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  };

  try {
    return await tryGenerate();
  } catch (err) {
    const is429 = err.status === 429 || (err.message && err.message.includes('429'));
    if (is429) {
      // Check if it's a daily quota (retryDelay hint > 30s) — not worth retrying
      const retryDelayMatch = err.message && err.message.match(/"retryDelay":"(\d+)s"/);
      const retryDelaySecs = retryDelayMatch ? parseInt(retryDelayMatch[1]) : 0;
      const isLongWait = retryDelaySecs > 30;

      if (!isLongWait) {
        // Per-minute rate limit — short delay, worth retrying once
        await new Promise(r => setTimeout(r, 1000));
        try {
          return await tryGenerate();
        } catch (retryErr) {
          console.warn(`Gemini retry failed for ${dimensionKey}:`, retryErr.message);
          return null;
        }
      }
      // Daily quota exhausted — use fallback immediately
      console.warn(`Gemini quota exhausted for ${dimensionKey} (retry in ${retryDelaySecs}s), using fallback`);
      return null;
    }
    console.warn(`Gemini failed for ${dimensionKey}:`, err.message);
    return null;
  }
}

/**
 * Generate Gemini narratives for all 8 dimensions in parallel (Promise.all).
 * Falls back gracefully on any error.
 */
async function generateNarratives(dimensions, localityName, profile = 'general', lat = null, lng = null) {
  const profileLabel = PROFILE_LABELS[profile] || PROFILE_LABELS.general;
  const city = detectCity(lat, lng);
  const cityCtx = CITY_CONTEXT[city];

  console.log(`[Gemini] City detected: ${cityCtx.cityName} (lat=${lat}, lng=${lng})`);

  const buildFallbacks = () => {
    const out = {};
    for (const key of DIMENSION_KEYS) {
      const d = dimensions[key] || {};
      out[key] = fallbackNarrative(key, d.score || 50, localityName, d.raw || {}, cityCtx);
    }
    return out;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbacks();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Call all 8 dimensions in parallel
    const results = await Promise.all(
      DIMENSION_KEYS.map(key => {
        const d = dimensions[key] || {};
        return generateOneDimension(
          model, key, d.score || 50, d.raw || {}, localityName, profileLabel, cityCtx
        );
      })
    );

    const narratives = {};
    for (let i = 0; i < DIMENSION_KEYS.length; i++) {
      const key = DIMENSION_KEYS[i];
      const d = dimensions[key] || {};
      narratives[key] = results[i] || fallbackNarrative(key, d.score || 50, localityName, d.raw || {}, cityCtx);
    }

    return narratives;
  } catch (err) {
    console.error('Gemini narrative generation failed:', err.message);
    return buildFallbacks();
  }
}

module.exports = { generateNarratives };
