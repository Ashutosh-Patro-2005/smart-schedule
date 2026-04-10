const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config(); // Load the API key from .env

const app = express();
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Allow backend to read JSON data

// Set up the AI brain using your secret key
const genAI = new GoogleGenerativeAI("AIzaSyDHSnKZviPCIc5xs_Ua37u_SzvZVA1Ftf0");

// This is the "route" our frontend will call later
app.post('/api/generate', async (req, res) => {
  try {
    const { userInput } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // The instructions for the AI
    const prompt = `Act as a professional schedule maker. Convert this user request into a structured daily schedule: "${userInput}". 
                    Return ONLY a JSON array of tasks. Each task must have: "title", "time", and "duration". 
                    Example: [{"title": "Study", "time": "10:00 AM", "duration": "1 hour"}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response (remove markdown if AI adds it)
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    // Send the clean list back to the frontend
    res.json(JSON.parse(cleanJson));
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong with the AI");
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
module.exports = app;