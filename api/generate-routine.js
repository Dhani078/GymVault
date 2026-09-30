// ====================================================================
// GYMVAULT AI ROUTINE GENERATOR (VERCEL SERVERLESS FUNCTION)
// ====================================================================

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { isHome = false, equipmentInventory = [], level = 'Intermediate', focus = 'Full Body', cnsScore = 3 } = req.body || {};

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured in server environment' });
    }

    const prompt = `You are an expert AI personal trainer.
Create a workout routine returning ONLY a valid JSON object. No markdown, no backticks.
The user is doing a ${isHome ? 'Home Workout' : 'Gym Workout'}.
Available Equipment: ${isHome && equipmentInventory.length > 0 ? equipmentInventory.join(', ') : 'Full Gym Equipment'}.
Difficulty: ${level}.
Focus Area: ${focus}.
CNS Fatigue (1=Tired, 5=Fresh): ${cnsScore}. 
Adjust volume/intensity based on CNS. The routine MUST focus on the requested Focus Area (e.g., if Push, include Chest/Shoulders/Triceps; if Pull, include Back/Biceps; if Legs, include Quads/Hamstrings/Glutes/Calves).
Format strictly:
{
  "name": "Generated Routine Name",
  "exercises": [
    { "name": "Exercise Name", "numSets": 3, "muscle_group": "Chest", "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300&auto=format&fit=crop" }
  ]
}
Ensure exercise names are popular (e.g., Squat, Push Up, Bench Press, Dumbbell Row, Romanian Deadlift). Limit to 4-6 exercises.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          let cleanStr = rawText.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
          const start = cleanStr.indexOf('{');
          const end = cleanStr.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            cleanStr = cleanStr.substring(start, end + 1);
          }
          const parsed = JSON.parse(cleanStr);
          if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
            return res.status(200).json(parsed);
          }
        }

        if (data?.error) {
          lastError = new Error(data.error.message || 'API error');
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('All AI models failed');
  } catch (error) {
    console.error('[api/generate-routine] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate routine' });
  }
}
