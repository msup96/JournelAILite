import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static('public'));

// Initialize Firebase Admin SDK
try {
  initializeApp({ projectId: "building-an-ai-journal" });
  console.log("✅ Firebase Admin initialized successfully");
} catch (e) {
  console.log("Firebase Admin already initialized.");
}

// Initialize Gemini API SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.error("❌ ERROR: GEMINI_API_KEY is missing from .env!");
const ai = new GoogleGenAI({ apiKey: apiKey });

// Authentication Middleware
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
}

// API Route: Mood-Aware Gemini Reflection
app.post('/api/reflect', authenticateUser, async (req, res) => {
  try {
    const { message, mood = 'Neutral', conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message payload is required.' });
    }

    // Dynamic System Instruction based on User's selected mood
    const systemInstruction = `
      You are an empathetic, insightful AI journal companion. 
      The user is currently feeling: "${mood}".
      
      Your goals:
      1. Tailor your emotional tone to match their reported mood (${mood}).
      2. Offer a warm, personalized reflection on their thoughts.
      3. Ask 1 deep, supportive follow-up question.
      4. Keep your response concise, structured, and under 150 words.
    `;

    const contents = [
      ...conversationHistory.map(item => ({
        role: item.role,
        parts: [{ text: item.text }]
      })),
      { role: 'user', parts: [{ text: `[Mood: ${mood}] ${message}` }] }
    ];

    // Call Gemini 3.6 Flash for Reflection
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiReply = response.text;

    // Generate short title summary
    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Summarize this journal thought in 5 words or less for a title: "${message}"`
    });
    const titleSummary = summaryResponse.text.trim().replace(/^["']|["']$/g, '');

    res.json({
      reply: aiReply,
      title: titleSummary
    });
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate reflection.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Enhanced Server running on http://localhost:${PORT}`));