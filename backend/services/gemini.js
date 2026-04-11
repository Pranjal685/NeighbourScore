const { GoogleGenerativeAI } = require('@google/generative-ai');

const DIMENSION_KEYS = [
  'air_quality', 'school_quality', 'flood_risk', 'healthcare',
  'crime_safety', 'transport', 'property_value', 'greenery',
];

const PROFILE_LABELS = {
  family:       'a family with young children',
  professional: 'a working professional',
  retiree:      'a retiree or senior',
  investor:     'a property investor',
  general:      'a homebuyer',
};

/**
 * Generate fallback narrative based on score band and profile.
 */
function fallbackNarrative(dimensionKey, score, localityName, profile = 'general') {
  const profileLabel = PROFILE_LABELS[profile] || PROFILE_LABELS.general;
  if (score >= 80) {
    return `This dimension scores excellently for ${localityName} — well above the Pune average. For ${profileLabel}, this is a strong positive signal.`;
  }
  if (score >= 60) {
    return `This dimension scores moderately for ${localityName}, around the Pune average. ${profileLabel.charAt(0).toUpperCase() + profileLabel.slice(1)} should weigh this carefully.`;
  }
  return `This dimension scores below average for ${localityName}. For ${profileLabel}, this is worth investigating before committing.`;
}

/**
 * Call Gemini to generate 2-sentence narratives for all 8 dimensions.
 * Falls back gracefully on any error.
 */
async function generateNarratives(dimensions, localityName, profile = 'general') {
  const profileLabel = PROFILE_LABELS[profile] || PROFILE_LABELS.general;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbacks = {};
      for (const key of DIMENSION_KEYS) {
        const score = dimensions[key]?.score || 50;
        fallbacks[key] = fallbackNarrative(key, score, localityName, profile);
      }
      return fallbacks;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are NeighbourScore AI, a neighborhood intelligence assistant for Indian homebuyers.
Generate a 2-sentence plain English narrative for each of the 8 dimensions below for the locality: ${localityName}.
The user has identified themselves as: ${profileLabel}.
Tailor your language to what matters to this type of person. For example, for a family emphasize what school scores mean for children's education. For a working professional emphasize commute implications. For a retiree emphasize what healthcare access means for day-to-day life. For a property investor emphasize returns and appreciation potential.
Use the actual score and raw numbers in your response. Be specific and practical, not generic.

Dimensions data:
${JSON.stringify(dimensions, null, 2)}

Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation:
{
  "air_quality": "narrative here",
  "school_quality": "narrative here",
  "flood_risk": "narrative here",
  "healthcare": "narrative here",
  "crime_safety": "narrative here",
  "transport": "narrative here",
  "property_value": "narrative here",
  "greenery": "narrative here"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Strip markdown code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const narratives = JSON.parse(cleaned);

    // Validate all keys exist, fill missing with fallbacks
    for (const key of DIMENSION_KEYS) {
      if (!narratives[key]) {
        const score = dimensions[key]?.score || 50;
        narratives[key] = fallbackNarrative(key, score, localityName);
      }
    }

    return narratives;
  } catch (err) {
    // Full fallback if Gemini fails
    console.error('Gemini narrative generation failed:', err.message);
    const fallbacks = {};
    for (const key of DIMENSION_KEYS) {
      const score = dimensions[key]?.score || 50;
      fallbacks[key] = fallbackNarrative(key, score, localityName, profile);
    }
    return fallbacks;
  }
}

module.exports = { generateNarratives };
