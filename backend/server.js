const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// 1. THE NUCLEAR CORS FIX (Must be at the very top)
app.use(cors({
    origin: '*', // Allows requests from anywhere
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Explicitly answers the preflight "scout"

// 2. Allow JSON data
app.use(express.json());

// 3. Setup Gemini AI securely
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 4. The Route (Must exactly match the frontend: /api/generate)
app.post('/generate', async (req, res) => {
    try {
        const { userInput } = req.body;

        const prompt = `Act as a professional schedule maker. Convert this user request into a structured daily schedule: "${userInput}".
        Return ONLY a JSON array of tasks. Each task must have: "title", "time", and "duration".
        Example: [{"title": "Study", "time": "10:00 AM", "duration": "1 hour"}]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up the text to ensure it's valid JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate schedule" });
    }
});

// 5. Test Route (Just to make sure the server is alive)
app.get('/', (req, res) => {
    res.send("Smart.Schedule Backend is LIVE!");
});

// 6. Export for Vercel
module.exports = app;