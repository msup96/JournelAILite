export interface ReminderEmailParams {
  displayName: string;
  userEmail: string;
  currentStreak: number;
  hoursSinceLastEntry: number;
  promptQuestion: string;
  promptTheme?: string;
  appUrl: string;
}

export function generateReminderEmailHtml(params: ReminderEmailParams): string {
  const {
    displayName,
    currentStreak,
    hoursSinceLastEntry,
    promptQuestion,
    promptTheme = "Self-Discovery & Presence",
    appUrl,
  } = params;

  const hoursText = hoursSinceLastEntry >= 48 
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
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
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
    .streak-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .streak-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .streak-val {
      font-size: 18px;
      font-weight: 800;
      color: #4f46e5;
    }
    .prompt-box {
      background: #f1f5f9;
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
    .footer a {
      color: #64748b;
      text-decoration: underline;
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
          It's been <strong>${hoursText}</strong> since your last journal reflection. In the flow of busy days, taking just 3 to 5 minutes to write can untangle your thoughts and restore mental clarity.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Mindful Streak</span><br>
                <span style="font-size: 18px; font-weight: 800; color: #f59e0b;">🔥 ${currentStreak} ${currentStreak === 1 ? "day" : "days"}</span>
              </td>
              <td align="right">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Daily Cadence</span><br>
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
        <p>Manage your reminder time or frequency anytime in your account settings.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
