const { GoogleGenerativeAI } = require('@google/generative-ai');

// Pure Vercel Serverless Function (No Express needed!)
module.exports = async (req, res) => {
    // 1. FORCE THE SECURITY GATES OPEN
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 2. HANDLE THE BROWSER'S PREFLIGHT "SCOUT" INSTANTLY
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. HANDLE THE ACTUAL AI SCHEDULE REQUEST
    if (req.method === 'POST') {
        try {
            const { userInput } = req.body;
            
            // Connect to Gemini
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Act as a professional schedule maker. Convert this user request into a structured daily schedule: "${userInput}".
            Return ONLY a JSON array of tasks. Each task must have: "title", "time", and "duration".
            Example: [{"title": "Study", "time": "10:00 AM", "duration": "1 hour"}]`;

            // Get AI Response
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean and Send JSON
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(cleanJson));

        } catch (error) {
            console.error("AI Error:", error);
            return res.status(500).json({ error: "Failed to generate schedule" });
        }
    }

    // 4. FALLBACK (If you visit the URL directly in a browser)
    return res.status(200).send("Vercel Native Backend is LIVE and waiting for POST requests!");
};