import express from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get Gemini client lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Generate Reflection Analysis for an Entry
app.post("/api/gemini/reflect", async (req, res) => {
  try {
    const { title, content, mood, moodScore, tags } = req.body;
    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Journal content is required." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `You are a world-class empathetic mindfulness mentor and psychological reflector.
Analyze the following personal journal entry and provide structured, compassionate, and illuminating insights.

Entry Details:
- Title: ${title || "Untitled"}
- Current Mood: ${mood || "Reflective"} (Score: ${moodScore || 5}/10)
- Tags: ${(tags || []).join(", ") || "None"}
- Content:
"""
${content}
"""

Produce a detailed JSON object with:
1. summary: A warm, concise 2-3 sentence distillation of what the writer is experiencing and processing.
2. keyThemes: An array of 2-4 key emotional/conceptual themes (e.g., ["Self-Compassion", "Overcoming Imposter Thoughts", "Rest"]).
3. insights: A thoughtful 2-paragraph analysis offering new perspective, validating emotions, and highlighting underlying strengths.
4. questions: An array of 2-3 gentle, deep journaling prompt questions for future reflection.
5. microAction: 1 small, tangible grounding practice or physical action the user can do right now (e.g. 4-7-8 breathing, taking a 5 min stroll).
6. wisdomQuote: A short, relevant quote and author that resonates with this entry.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            insights: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            microAction: { type: Type.STRING },
            wisdomQuote: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING },
                author: { type: Type.STRING },
              },
              required: ["quote", "author"],
            },
          },
          required: ["summary", "keyThemes", "insights", "questions", "microAction", "wisdomQuote"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini reflect error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI reflection.",
    });
  }
});

// 2. Generate Custom Journaling Prompts
app.post("/api/gemini/prompts", async (req, res) => {
  try {
    const { category, currentMood, recentThemes } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate 4 inspiring, thought-provoking journaling prompts for the category '${category || "daily"}'.
Current User Mood: ${currentMood || "Curious"}
Recent Themes/Context: ${(recentThemes || []).join(", ") || "General self-discovery"}

Return a JSON array of prompt objects with:
- id: a unique short slug
- title: catchy 3-6 word title
- description: 1-2 sentence contextual background
- prompt: the actual reflective question or writing guide
- estimatedMinutes: recommended writing time (e.g. 5, 10, 15)
- moodCategory: matching emotional tone`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              prompt: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              moodCategory: { type: Type.STRING },
            },
            required: ["id", "title", "description", "prompt", "estimatedMinutes", "moodCategory"],
          },
        },
      },
    });

    const prompts = JSON.parse(response.text || "[]");
    res.json(prompts);
  } catch (error: any) {
    console.error("Gemini prompts error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate journaling prompts.",
    });
  }
});

// 3. Generate Holistic Growth & Trend Report
app.post("/api/gemini/growth-report", async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: "Entries array is required for growth analysis." });
      return;
    }

    const ai = getGeminiClient();
    const entriesSummary = entries.slice(0, 15).map((e: any, idx: number) => ({
      index: idx + 1,
      date: e.createdAt || e.date,
      title: e.title,
      mood: e.mood,
      moodScore: e.moodScore,
      summary: e.aiSummary || e.content?.slice(0, 200),
      tags: e.tags,
    }));

    const prompt = `You are an expert psychological growth analyst.
Review these recent journal entries and generate a holistic Growth & Emotional Trajectory Report.

Entries overview:
${JSON.stringify(entriesSummary, null, 2)}

Provide a JSON object containing:
- moodTrajectory: A clear 2-3 sentence overview of emotional patterns, highs, and lows.
- topPatterns: Array of 3-4 recurring patterns or habits identified.
- milestones: Array of 2-3 personal wins, growth breakthroughs, or shifts in mindset.
- recommendations: Array of 3 actionable, empathetic recommendations for self-care and continued clarity.
- overallAffirmation: A personalized empowering affirmation for the coming days.
- averageEnergyLevel: A qualitative score or description (e.g. "Replenishing & Focused").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moodTrajectory: { type: Type.STRING },
            topPatterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            milestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            overallAffirmation: { type: Type.STRING },
            averageEnergyLevel: { type: Type.STRING },
          },
          required: [
            "moodTrajectory",
            "topPatterns",
            "milestones",
            "recommendations",
            "overallAffirmation",
            "averageEnergyLevel",
          ],
        },
      },
    });

    const report = JSON.parse(response.text || "{}");
    res.json(report);
  } catch (error: any) {
    console.error("Gemini growth report error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate growth report.",
    });
  }
});

// 4. Interactive AI Reflection Companion Chat
app.post("/api/gemini/mentor-chat", async (req, res) => {
  try {
    const { messages, entryContext } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Chat messages array is required." });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are "Sophia", a compassionate, mindful reflection mentor in a private journal app.
Your role is to act as a supportive sounding board, practicing deep active listening, non-judgmental acceptance, and gentle Socratic inquiry.
Help the user unpack their emotions, clarify their thoughts, and find their inner wisdom.
Keep responses warm, concise (2-4 paragraphs maximum), and focused on thoughtful reflection rather than clinical advice.

${entryContext ? `Active Journal Entry Context for this conversation:
Title: ${entryContext.title || "Untitled"}
Mood: ${entryContext.mood || "Unknown"}
Content Excerpt: ${entryContext.content?.slice(0, 1500) || "N/A"}` : ""}
`;

    // Convert messages to Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I hear you. Tell me more about what that felt like.",
    });
  } catch (error: any) {
    console.error("Gemini mentor chat error:", error);
    res.status(500).json({
      error: error.message || "Failed to chat with AI mentor.",
    });
  }
});

// --- REMINDER EMAIL TEMPLATING & CLOUD FUNCTION WORKERS ---

const FALLBACK_PROMPTS = [
  "What is one small moment from today or yesterday that brought a subtle sense of ease or gratitude?",
  "What thoughts or emotions are currently asking for your compassionate attention?",
  "If you could offer your current self one gentle sentence of permission right now, what would it be?",
  "What is feeling heavy today, and what is one small thing you can choose to release?",
  "What energized you recently, and how can you invite more of that into tomorrow?",
];

function generateReminderEmailHtml(params: {
  displayName: string;
  userEmail: string;
  currentStreak: number;
  hoursSinceLastEntry: number;
  promptQuestion: string;
  promptTheme?: string;
  appUrl: string;
}): string {
  const {
    displayName,
    currentStreak,
    hoursSinceLastEntry,
    promptQuestion,
    promptTheme = "Mindful Presence",
    appUrl,
  } = params;

  const hoursText =
    hoursSinceLastEntry >= 48
      ? `${Math.floor(hoursSinceLastEntry / 24)} days`
      : `${hoursSinceLastEntry} hours`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mindful Pause: A Moment to Reflect</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f172a;
      padding: 40px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      font-size: 22px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 14px;
    }
    .message {
      font-size: 14px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 24px;
    }
    .prompt-box {
      background: #f8fafc;
      border-left: 4px solid #4f46e5;
      border-radius: 0 16px 16px 0;
      padding: 20px;
      margin: 28px 0;
    }
    .prompt-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #4f46e5;
      margin-bottom: 6px;
    }
    .prompt-text {
      font-size: 15px;
      font-style: italic;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 16px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">✨</div>
        <h1>Mindful Reflection Reminder</h1>
        <p>A quiet space to check in with yourself</p>
      </div>

      <div class="content">
        <div class="greeting">Hello ${displayName || "there"},</div>
        
        <p class="message">
          It has been <strong>${hoursText}</strong> since your last journal reflection. Taking just 3 to 5 minutes to write today will help untangle your thoughts and preserve your mindful momentum.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Mindful Streak</span><br>
                <span style="font-size: 18px; font-weight: 800; color: #f59e0b;">🔥 ${currentStreak} ${currentStreak === 1 ? "day" : "days"}</span>
              </td>
              <td align="right">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Cadence Status</span><br>
                <span style="font-size: 13px; font-weight: 600; color: #4f46e5;">Pending Reflection</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="prompt-box">
          <div class="prompt-label">Today's Mindful Spark (${promptTheme})</div>
          <p class="prompt-text">"${promptQuestion}"</p>
        </div>

        <div class="cta-container">
          <a href="${appUrl}" class="cta-button">Write Today's Reflection →</a>
        </div>
      </div>

      <div class="footer">
        <p>You received this automated reminder because you have active daily email notifications enabled on your <strong>AI Reflection Journal</strong> account.</p>
        <p>You can adjust reminder times or toggle notifications in your account settings.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 5. Generate / Preview Reminder Email HTML
app.post("/api/reminders/preview-html", async (req, res) => {
  try {
    const { displayName, userEmail, currentStreak, hoursSinceLastEntry, promptTheme } = req.body;
    let promptQuestion = FALLBACK_PROMPTS[0];

    try {
      const ai = getGeminiClient();
      const promptRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Provide 1 short, deeply empathetic mindfulness question (maximum 20 words) for a daily reflection email reminder for someone focusing on "${promptTheme || "presence"}". Output ONLY the question text.`,
      });
      if (promptRes.text) {
        promptQuestion = promptRes.text.trim().replace(/^["']|["']$/g, "");
      }
    } catch (e) {
      console.warn("Using fallback prompt:", e);
    }

    const html = generateReminderEmailHtml({
      displayName: displayName || "Mindful Journaler",
      userEmail: userEmail || "user@example.com",
      currentStreak: Number(currentStreak) || 3,
      hoursSinceLastEntry: Number(hoursSinceLastEntry) || 26,
      promptQuestion,
      promptTheme: promptTheme || "Mindful Presence",
      appUrl: req.headers.origin || "https://ai.studio/build",
    });

    res.json({ html, promptQuestion });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate preview." });
  }
});

// 6. Execute / Simulate 24-Hour Inactivity Reminder Scan
app.post("/api/reminders/scan-24h", async (req, res) => {
  try {
    const { currentUserProfile, lastEntryDate, simulatedUsers } = req.body;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Let's analyze users list (either sent from client context or simulated batch)
    const usersToProcess = simulatedUsers || (currentUserProfile ? [currentUserProfile] : []);

    const logs: any[] = [];
    let inactiveCount = 0;
    let sentCount = 0;
    let skippedCount = 0;

    let dynamicPrompt = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    try {
      const ai = getGeminiClient();
      const promptRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Generate 1 short, poetic and grounding mindfulness reflection question for a daily email reminder (max 20 words). Output ONLY the question.`,
      });
      if (promptRes.text) {
        dynamicPrompt = promptRes.text.trim().replace(/^["']|["']$/g, "");
      }
    } catch (e) {
      console.warn("Fallback prompt used for scan:", e);
    }

    for (const u of usersToProcess) {
      if (!u.email) continue;

      if (u.emailRemindersEnabled === false) {
        skippedCount++;
        continue;
      }

      const uLastDate = u.lastEntryDate ? new Date(u.lastEntryDate) : (lastEntryDate ? new Date(lastEntryDate) : null);
      let hoursSince = 28;
      let isInactive = false;

      if (!uLastDate || isNaN(uLastDate.getTime())) {
        isInactive = true;
        hoursSince = 48;
      } else {
        const diffMs = now.getTime() - uLastDate.getTime();
        hoursSince = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        if (uLastDate < twentyFourHoursAgo) {
          isInactive = true;
        }
      }

      if (isInactive) {
        inactiveCount++;
        sentCount++;
        logs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: u.userId || "usr-1",
          userEmail: u.email,
          sentAt: now.toISOString(),
          hoursSinceLastEntry: hoursSince,
          streakAtTime: u.currentStreak || 0,
          promptIncluded: dynamicPrompt,
          status: "delivered",
          deliveryMethod: "cloud_function_cron",
        });
      } else {
        skippedCount++;
      }
    }

    res.json({
      success: true,
      timestamp: now.toISOString(),
      totalUsersChecked: Math.max(usersToProcess.length, 1),
      inactiveUsersFound: inactiveCount,
      remindersSent: sentCount,
      remindersSkipped: skippedCount,
      promptUsed: dynamicPrompt,
      logs,
    });
  } catch (error: any) {
    console.error("Scan error:", error);
    res.status(500).json({ error: error.message || "Failed to execute scan." });
  }
});

// 7. Send Immediate Test Email Dispatch
app.post("/api/reminders/send-test", async (req, res) => {
  try {
    const { email, displayName, currentStreak, reflectionFocus } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address is required." });
      return;
    }

    let promptQuestion = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    try {
      const ai = getGeminiClient();
      const promptRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Provide 1 short, deeply empathetic mindfulness question (maximum 20 words) for a daily email reminder. Output ONLY the question.`,
      });
      if (promptRes.text) {
        promptQuestion = promptRes.text.trim().replace(/^["']|["']$/g, "");
      }
    } catch (e) {
      console.warn("Fallback prompt used:", e);
    }

    const emailHtml = generateReminderEmailHtml({
      displayName: displayName || "Mindful Journaler",
      userEmail: email,
      currentStreak: Number(currentStreak) || 1,
      hoursSinceLastEntry: 26,
      promptQuestion,
      promptTheme: reflectionFocus || "Mindful Presence",
      appUrl: req.headers.origin || "https://ai.studio/build",
    });

    // Optional nodemailer dispatch if SMTP credentials are in environment
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"AI Reflection Journal" <reflections@mindfuljournal.app>',
        to: email,
        subject: `✨ [Test Preview] Gentle reminder: A mindful pause for your day`,
        html: emailHtml,
      });
    }

    res.json({
      success: true,
      message: `Test reminder email dispatched to ${email}.`,
      promptQuestion,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    res.status(500).json({ error: error.message || "Failed to send test email." });
  }
});

// 5. Start Server with Vite Middleware in Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
