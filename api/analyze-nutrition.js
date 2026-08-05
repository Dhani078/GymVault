export default async function handler(req, res) {
  // 1. Setup CORS untuk mengizinkan aplikasi React Native mengakses API ini
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Jika ini adalah preflight request dari browser/app
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // API ini hanya menerima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Image, knownNames } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Mengambil API Key dari Environment Variable Vercel
    // Kita gunakan EXPO_PUBLIC_GEMINI_API_KEY sesuai dengan yang ada di screenshot Vercel kamu
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in Vercel Environment Variables");
      return res.status(500).json({ error: 'Server configuration error (API Key missing)' });
    }

    const promptText = `Analyze this food image. Classify it into one of these exact known categories if it matches or looks like them: [${knownNames || ''}]. Otherwise, estimate the calorie and macros. Return ONLY a valid JSON object strictly matching this format without markdown wrappers: {"food": "Category Name", "cal": 0, "p": 0, "c": 0, "f": 0}. If no food is detected, return {"food": "Unknown", "cal": 0, "p": 0, "c": 0, "f": 0}.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(500).json({ error: data.error.message || "API Error" });
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    let cleanJsonStr = textResponse.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    const jsonStart = cleanJsonStr.indexOf('{');
    const jsonEnd = cleanJsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanJsonStr = cleanJsonStr.substring(jsonStart, jsonEnd + 1);
    }
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJsonStr);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", parseError);
      parsedResult = { food: "Hasil Analisis Tidak Dikenali", cal: 0, p: 0, c: 0, f: 0 };
    }

    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
