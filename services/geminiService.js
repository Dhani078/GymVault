// ═══════════════════════════════════════════════════════════════
// GYMVAULT INTELLIGENT MULTI-MODEL GEMINI CASCADE SERVICE
// ═══════════════════════════════════════════════════════════════

export const GEMINI_MODELS_CASCADE = [
  'gemini-3.7-flash',     // 🥇 Paling Pintar, Hybrid Reasoning & Vision Detail
  'gemini-3.6-flash',     // 🥈 Generasi 3.6 Cepat & Multimodal
  'gemini-3.5-flash',     // 🥉 Generasi 3.5 Handal
  'gemini-3.1-flash-lite',// ⚡ Super Ringan & Hemat Token
  'gemini-2.5-flash',     // 🛡️ Sangat Stabil & High-Availability
  'gemini-2.5-flash-lite',// 🚀 Cadangan Cepat
  'gemini-1.5-flash'      // 🔁 Emergency Fallback
];

/**
 * Execute a prompt or image analysis with automatic fallback cascade across all Gemini models.
 * @param {Object} options
 * @param {string} options.prompt - Text prompt
 * @param {string} [options.imageBase64] - Optional base64 encoded image
 * @param {string} [options.mimeType] - e.g. 'image/jpeg'
 * @param {string} [options.responseMimeType] - e.g. 'application/json'
 * @param {number} [options.temperature] - 0.0 to 1.0 (default 0.2)
 * @returns {Promise<{ text: string, modelUsed: string }>}
 */
export async function generateWithGeminiCascade({
  prompt,
  imageBase64 = null,
  mimeType = 'image/jpeg',
  responseMimeType = null,
  temperature = 0.2
}) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured in .env');
  }

  const parts = [{ text: prompt }];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: temperature,
      ...(responseMimeType ? { responseMimeType } : {})
    }
  };

  let lastError = null;

  for (const modelName of GEMINI_MODELS_CASCADE) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          text: data.candidates[0].content.parts[0].text,
          modelUsed: modelName
        };
      }

      if (data?.error) {
        console.warn(`[Gemini Cascade] ${modelName} error (${data.error.code || data.error.status}): ${data.error.message}, switching to next model...`);
        lastError = new Error(data.error.message || 'Model API error');
      }
    } catch (err) {
      console.warn(`[Gemini Cascade] ${modelName} fetch failed, trying next...`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('[GymVault Gemini] All 7 cascade models failed. Check API key validity and model name availability at https://ai.google.dev/models/gemini');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEMINI_MODELS_CASCADE,
    generateWithGeminiCascade
  };
}
