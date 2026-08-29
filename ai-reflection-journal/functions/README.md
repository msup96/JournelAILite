# Firebase Cloud Functions: Daily Automated Journal Reminders

This directory contains the production Firebase Cloud Functions (v2) for **AI Reflection Journal**.

## Scheduled Functions Overview

### 1. `scheduledDailyJournalReminder`
- **Schedule**: `every day 09:00` (America/New_York)
- **Trigger**: Cloud Scheduler (cron)
- **Logic**:
  1. Queries all registered users from `/users`.
  2. Filters users who have `emailRemindersEnabled !== false`.
  3. Inspects their most recent journal entry from `/entries` (or `lastEntryTimestamp`).
  4. Identifies users who have **not created an entry in the last 24 hours**.
  5. Generates a personalized mindfulness reflection spark via Gemini API (`gemini-3.7-flash`).
  6. Dispatches a responsive HTML reminder email with current streak data and writing link.
  7. Writes to Firestore `/users/{userId}/reminder_logs` and updates `lastReminderSentAt`.

### 2. `triggerDailyReminderScan` (HTTPS endpoint)
- Allows manual triggering or webhook calls to run the 24-hour inactivity scan on demand.

### 3. `sendTestReminderEmail` (HTTPS endpoint)
- Sends an instant sample reminder email to test delivery format and dynamic prompt generation.

---

## Deployment Instructions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Configure Environment Secrets (Optional for Custom SMTP)**:
   ```bash
   firebase functions:secrets:set SMTP_HOST
   firebase functions:secrets:set SMTP_PORT
   firebase functions:secrets:set SMTP_USER
   firebase functions:secrets:set SMTP_PASS
   firebase functions:secrets:set GEMINI_API_KEY
   ```

4. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

5. **Test locally using Firebase Emulator Suite**:
   ```bash
   npm --prefix functions run serve
   ```
