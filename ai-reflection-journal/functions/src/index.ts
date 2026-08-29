import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import { generateReminderEmailHtml } from "./emailTemplates";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Curated backup prompts if Gemini is unreachable
const FALLBACK_PROMPTS = [
  "What is one small moment from today or yesterday that brought a subtle sense of ease or gratitude?",
  "What thoughts or emotions are currently asking for your compassionate attention?",
  "If you could offer your current self one gentle sentence of permission right now, what would it be?",
  "What is feeling heavy today, and what is one small thing you can choose to release?",
  "What energized you recently, and how can you invite more of that into tomorrow?",
];

// Reusable transporter helper
function getMailTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback to JSON/stream transporter for safe sandbox & testing execution
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

/**
 * Core scanning and notification logic for users who have not logged
 * a reflection entry in the last 24 hours.
 */
export async function execute24HourReminderScan(appBaseUrl?: string) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  const baseUrl = appBaseUrl || process.env.APP_URL || "https://ai.studio/build";

  logger.info(`Starting 24-Hour Journal Inactivity Scan at ${now.toISOString()}...`);

  const usersSnapshot = await db.collection("users").get();
  const results = {
    timestamp: now.toISOString(),
    totalUsersChecked: usersSnapshot.size,
    inactiveUsersFound: 0,
    remindersSent: 0,
    remindersSkipped: 0,
    logs: [] as any[],
  };

  const transporter = getMailTransporter();
  const ai = getGeminiClient();

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    const userEmail = userData.email;

    if (!userEmail) {
      continue;
    }

    // Check if user disabled reminder emails
    if (userData.emailRemindersEnabled === false) {
      results.remindersSkipped++;
      continue;
    }

    // Check when user last received a reminder email (skip if sent in last 20 hours)
    if (userData.lastReminderSentAt) {
      const lastSent = new Date(userData.lastReminderSentAt);
      if (lastSent > twentyHoursAgo) {
        results.remindersSkipped++;
        continue;
      }
    }

    // Query most recent journal entry for this user
    let lastEntryDate: Date | null = null;

    if (userData.lastEntryTimestamp) {
      lastEntryDate = new Date(userData.lastEntryTimestamp);
    } else if (userData.lastEntryDate) {
      lastEntryDate = new Date(userData.lastEntryDate);
    } else {
      // Query entries collection
      const recentEntriesQuery = await db
        .collection("entries")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (!recentEntriesQuery.empty) {
        const entryData = recentEntriesQuery.docs[0].data();
        lastEntryDate = new Date(entryData.createdAt || entryData.updatedAt);
      }
    }

    // Determine inactivity status
    let hoursSinceLast = 24;
    let isInactive = false;

    if (!lastEntryDate || isNaN(lastEntryDate.getTime())) {
      // User has never created an entry
      isInactive = true;
      hoursSinceLast = 72; // Default marker
    } else {
      const msDiff = now.getTime() - lastEntryDate.getTime();
      hoursSinceLast = Math.max(1, Math.round(msDiff / (1000 * 60 * 60)));
      if (lastEntryDate < twentyFourHoursAgo) {
        isInactive = true;
      }
    }

    if (!isInactive) {
      continue;
    }

    results.inactiveUsersFound++;

    // Generate dynamic mindfulness spark
    let promptQuestion = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    if (ai) {
      try {
        const promptRes = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: `Provide 1 short, deeply empathetic mindfulness question (maximum 20 words) for a daily reflection email reminder. Output ONLY the question.`,
        });
        if (promptRes.text) {
          promptQuestion = promptRes.text.trim().replace(/^["']|["']$/g, "");
        }
      } catch (err) {
        logger.warn(`Gemini prompt generation fallback used: ${err}`);
      }
    }

    const emailHtml = generateReminderEmailHtml({
      displayName: userData.displayName || "Journaler",
      userEmail,
      currentStreak: userData.currentStreak || 0,
      hoursSinceLastEntry: hoursSinceLast,
      promptQuestion,
      promptTheme: userData.reflectionFocus || "Mindful Presence",
      appUrl: baseUrl,
    });

    try {
      // 1. Send via email transporter
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"AI Reflection Journal" <reflections@mindfuljournal.app>',
        to: userEmail,
        subject: `✨ Gentle reminder: A mindful pause for your day (${userData.currentStreak || 0}d streak)`,
        html: emailHtml,
        text: `Hello ${userData.displayName || "there"},\n\nIt's been ${hoursSinceLast} hours since your last reflection.\n\nToday's spark: "${promptQuestion}"\n\nOpen your journal: ${baseUrl}`,
      });

      // 2. Also write to Firebase Trigger Email standard collection (/mail) if configured
      await db.collection("mail").add({
        to: userEmail,
        message: {
          subject: `✨ Gentle reminder: A mindful pause for your day`,
          html: emailHtml,
        },
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Log into user subcollection /users/{userId}/reminder_logs
      const logRef = db.collection("users").doc(userId).collection("reminder_logs").doc();
      const logData = {
        id: logRef.id,
        userId,
        userEmail,
        sentAt: now.toISOString(),
        hoursSinceLastEntry: hoursSinceLast,
        streakAtTime: userData.currentStreak || 0,
        promptIncluded: promptQuestion,
        status: "delivered",
        deliveryMethod: process.env.SMTP_USER ? "email_smtp" : "firestore_trigger_mail",
      };

      await logRef.set(logData);

      // 4. Update user's lastReminderSentAt
      await userDoc.ref.update({
        lastReminderSentAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      results.remindersSent++;
      results.logs.push(logData);
      logger.info(`Reminder email dispatched to ${userEmail} (inactive for ${hoursSinceLast}h)`);
    } catch (sendErr: any) {
      logger.error(`Failed to send reminder to ${userEmail}:`, sendErr);
      results.logs.push({
        userId,
        userEmail,
        sentAt: now.toISOString(),
        status: "skipped",
        reason: sendErr?.message || "Send error",
      });
    }
  }

  logger.info(`24h Inactivity Scan completed. ${results.remindersSent} reminders dispatched.`);
  return results;
}

/**
 * 1. Scheduled Cloud Function (Runs Daily at 09:00 AM UTC)
 * Configured with Firebase Functions v2 onSchedule.
 */
export const scheduledDailyJournalReminder = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "America/New_York",
    retryCount: 3,
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async () => {
    logger.info("Triggered scheduledDailyJournalReminder cron job.");
    await execute24HourReminderScan();
  }
);

/**
 * 2. HTTP OnRequest Endpoint for Manual/Admin Trigger & Live Testing
 */
export const triggerDailyReminderScan = onRequest(
  { cors: true, timeoutSeconds: 300 },
  async (req, res) => {
    try {
      const appUrl = (req.body?.appUrl || req.query.appUrl) as string | undefined;
      const scanResults = await execute24HourReminderScan(appUrl);
      res.status(200).json({
        success: true,
        message: "24-Hour Journal Inactivity scan completed successfully.",
        results: scanResults,
      });
    } catch (error: any) {
      logger.error("Error in triggerDailyReminderScan:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to execute reminder scan.",
      });
    }
  }
);

/**
 * 3. HTTP OnRequest to Send a Single Immediate Test Reminder Email
 */
export const sendTestReminderEmail = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { email, displayName, currentStreak, appUrl } = req.body || {};
      if (!email) {
        res.status(400).json({ error: "Email is required." });
        return;
      }

      const promptQuestion = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
      const emailHtml = generateReminderEmailHtml({
        displayName: displayName || "Journaler",
        userEmail: email,
        currentStreak: Number(currentStreak) || 0,
        hoursSinceLastEntry: 26,
        promptQuestion,
        appUrl: appUrl || "https://ai.studio/build",
      });

      const transporter = getMailTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"AI Reflection Journal" <reflections@mindfuljournal.app>',
        to: email,
        subject: `[Test] ✨ Gentle reminder: A mindful pause for your day`,
        html: emailHtml,
      });

      res.status(200).json({
        success: true,
        message: `Test reminder email prepared and sent to ${email}.`,
        previewPrompt: promptQuestion,
      });
    } catch (error: any) {
      logger.error("Error in sendTestReminderEmail:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send test reminder email.",
      });
    }
  }
);
