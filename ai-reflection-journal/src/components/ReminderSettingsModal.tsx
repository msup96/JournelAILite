import React, { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Play,
  Send,
  Sparkles,
  Terminal,
  X,
  Flame,
  Calendar,
  History,
  Eye,
  Settings,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { ReminderLog, ReminderScanResult, JournalEntry } from "../types";

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"settings" | "preview" | "scanner" | "logs" | "deployment">("settings");
  
  // Settings local state
  const [emailEnabled, setEmailEnabled] = useState<boolean>(userProfile?.emailRemindersEnabled !== false);
  const [reminderTime, setReminderTime] = useState<string>(userProfile?.reminderTime || "09:00");
  const [reflectionFocus, setReflectionFocus] = useState<string>(userProfile?.reflectionFocus || "Mindful Presence");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Email Preview state
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Scanner / Trigger state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ReminderScanResult | null>(null);

  // Test Email state
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);

  // Logs state
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Calculate 24h inactivity
  const latestEntry = entries.length > 0 ? entries[0] : null;
  const now = new Date();
  let hoursSinceLastEntry = 24;
  let isWithin24Hours = false;

  if (latestEntry?.createdAt) {
    const entryDate = new Date(latestEntry.createdAt);
    const diffMs = now.getTime() - entryDate.getTime();
    hoursSinceLastEntry = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    isWithin24Hours = hoursSinceLastEntry < 24;
  } else if (userProfile?.lastEntryDate) {
    const entryDate = new Date(userProfile.lastEntryDate);
    const diffMs = now.getTime() - entryDate.getTime();
    hoursSinceLastEntry = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    isWithin24Hours = hoursSinceLastEntry < 24;
  }

  useEffect(() => {
    if (userProfile) {
      setEmailEnabled(userProfile.emailRemindersEnabled !== false);
      if (userProfile.reminderTime) setReminderTime(userProfile.reminderTime);
      if (userProfile.reflectionFocus) setReflectionFocus(userProfile.reflectionFocus);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isOpen && activeTab === "preview") {
      fetchEmailPreview();
    }
    if (isOpen && activeTab === "logs" && user) {
      fetchLogs();
    }
  }, [isOpen, activeTab, user]);

  const fetchEmailPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/reminders/preview-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: user?.displayName || userProfile?.displayName || "Mindful Journaler",
          userEmail: user?.email || userProfile?.email || "user@example.com",
          currentStreak: userProfile?.currentStreak || (isWithin24Hours ? 3 : 0),
          hoursSinceLastEntry: isWithin24Hours ? hoursSinceLastEntry : Math.max(26, hoursSinceLastEntry),
          promptTheme: reflectionFocus,
        }),
      });
      const data = await res.json();
      if (data.html) {
        setEmailPreviewHtml(data.html);
      }
    } catch (err) {
      console.error("Failed to load email preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      const logsRef = collection(db, "users", user.uid, "reminder_logs");
      const q = query(logsRef, orderBy("sentAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const fetchedLogs: ReminderLog[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ReminderLog, "id">),
      }));
      setLogs(fetchedLogs);
    } catch (err) {
      console.warn("Could not fetch remote reminder logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        emailRemindersEnabled: emailEnabled,
        reminderTime,
        reflectionFocus,
        updatedAt: new Date().toISOString(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/reminders/scan-24h", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserProfile: {
            userId: user?.uid || "usr-1",
            email: user?.email || "user@example.com",
            displayName: user?.displayName || "Journaler",
            currentStreak: userProfile?.currentStreak || 0,
            lastEntryDate: latestEntry?.createdAt || userProfile?.lastEntryDate || null,
            emailRemindersEnabled: emailEnabled,
            reflectionFocus,
          },
          lastEntryDate: latestEntry?.createdAt || null,
        }),
      });
      const data = await res.json();
      setScanResult(data);

      // If a reminder log was created and user is signed in, store to Firestore logs subcollection
      if (user && data.logs && data.logs.length > 0) {
        try {
          const logRef = collection(db, "users", user.uid, "reminder_logs");
          for (const item of data.logs) {
            await addDoc(logRef, item);
          }
          fetchLogs();
        } catch (e) {
          console.warn("Could not write log locally:", e);
        }
      }
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!user?.email) return;
    setIsSendingTest(true);
    setTestSentMsg(null);
    try {
      const res = await fetch("/api/reminders/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || "Mindful Journaler",
          currentStreak: userProfile?.currentStreak || 1,
          reflectionFocus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSentMsg(`Test reminder email prepared for ${user.email} with prompt: "${data.promptQuestion}"`);
      }
    } catch (err) {
      console.error("Test email failed:", err);
      setTestSentMsg("Failed to dispatch test email.");
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestSentMsg(null), 6000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Automated 24-Hour Reminder Engine
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Firebase Cloud Functions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated daily email dispatch for users without journal entries in the last 24 hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 24-Hour Inactivity Live Status Banner */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {isWithin24Hours ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Journaled {hoursSinceLastEntry === 0 ? "just now" : `${hoursSinceLastEntry}h ago`} (Active Habit)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>No entry in last {hoursSinceLastEntry} hours (Eligible for reminder email)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Streak: <strong>{userProfile?.currentStreak || 0} days</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !user?.email}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSendingTest ? "Sending Test..." : "Send Test Email"}
            </button>
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {isScanning ? "Running Scan..." : "Run 24h Scan"}
            </button>
          </div>
        </div>

        {/* Test Msg Notification */}
        {testSentMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{testSentMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            Notification Preferences
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "preview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-4 h-4" />
            Email Preview
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "scanner"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Live Scheduler Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "logs"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            Dispatch Logs
          </button>
          <button
            onClick={() => setActiveTab("deployment")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "deployment"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Cloud Functions Code
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Daily Reminder Emails</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send an inspiring mindfulness spark if you haven't written an entry in 24 hours.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Reminder Time
                    </label>
                    <select
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="08:00">Morning Clarity (08:00 AM)</option>
                      <option value="09:00">Standard Morning (09:00 AM)</option>
                      <option value="13:00">Mid-day Check-in (01:00 PM)</option>
                      <option value="19:00">Evening Wind-Down (07:00 PM)</option>
                      <option value="21:30">Night Reflection (09:30 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mindfulness Spark Focus
                    </label>
                    <select
                      value={reflectionFocus}
                      onChange={(e) => setReflectionFocus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Mindful Presence">Mindful Presence & Calm</option>
                      <option value="Gratitude & Joy">Gratitude & Daily Joy</option>
                      <option value="Stress Release">Stress Release & Grounding</option>
                      <option value="Creative Clarity">Creative Clarity & Purpose</option>
                      <option value="Self-Compassion">Self-Compassion & Resilience</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Recipient: <span className="text-indigo-300 font-medium">{user?.email || "Signed-in account email"}</span>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Preferences"}
                  </button>
                </div>
              </div>

              {/* Inactivity Guard Policy */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200">24-Hour Anti-Spam Guard & Rate Limiting</p>
                  <p className="text-slate-400 leading-relaxed">
                    Cloud Functions evaluate the timestamp of your last journal reflection. If an entry is created within the last 24 hours, email reminders are automatically suppressed to keep your inbox clean.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Live HTML preview of the email rendered for <strong>{user?.email || "user@example.com"}</strong>
                </p>
                <button
                  onClick={fetchEmailPreview}
                  disabled={loadingPreview}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
                  Regenerate Spark
                </button>
              </div>

              <div className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-950 p-2">
                {loadingPreview ? (
                  <div className="h-96 flex items-center justify-center text-xs text-slate-400">
                    Generating dynamic email preview...
                  </div>
                ) : (
                  <iframe
                    title="Email Preview"
                    srcDoc={emailPreviewHtml}
                    className="w-full h-[460px] rounded-xl bg-white border-0"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SCANNER & DIAGNOSTICS */}
          {activeTab === "scanner" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Run 24-Hour Inactivity Scheduler</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Executes the Cloud Function scanning engine across users to evaluate journal timestamps.
                    </p>
                  </div>
                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {isScanning ? "Evaluating Inactivity..." : "Execute Scan"}
                  </button>
                </div>
              </div>

              {scanResult && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Execution Summary ({new Date(scanResult.timestamp).toLocaleTimeString()})
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-extrabold text-slate-100">{scanResult.totalUsersChecked}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">Users Checked</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-extrabold text-amber-400">{scanResult.inactiveUsersFound}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">Inactive (&gt;24h)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-extrabold text-emerald-400">{scanResult.remindersSent}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">Dispatched</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-extrabold text-slate-400">{scanResult.remindersSkipped}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">Skipped (Active/Opt-out)</div>
                    </div>
                  </div>

                  {scanResult.logs && scanResult.logs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold text-slate-300">Generated Mindful Prompt:</div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs italic text-indigo-300">
                        "{scanResult.logs[0].promptIncluded}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DISPATCH LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Past Reminder Notifications ({logs.length})
                </h3>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  Refresh Logs
                </button>
              </div>

              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading reminder records...</div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No reminder emails dispatched yet. Reminders are triggered when no journal entry exists in 24 hours.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{log.userEmail}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            {log.status}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(log.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-400 italic">"{log.promptIncluded}"</p>
                      </div>
                      <div className="text-right shrink-0 text-slate-400 text-[11px]">
                        <div>Inactive: <strong className="text-slate-200">{log.hoursSinceLastEntry}h</strong></div>
                        <div>Streak: <strong className="text-amber-400">{log.streakAtTime}d</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DEPLOYMENT GUIDE */}
          {activeTab === "deployment" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Firebase Functions v2 Schedule</span>
                  <span className="text-indigo-400">functions/src/index.ts</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed p-2 bg-slate-900/80 rounded-xl">
{`export const scheduledDailyJournalReminder = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "America/New_York",
    retryCount: 3,
    memory: "512MiB",
  },
  async () => {
    // 1. Queries users from Firestore
    // 2. Evaluates last journal entry timestamp
    // 3. Generates mindful prompts via Gemini
    // 4. Dispatches HTML reminder email
    await execute24HourReminderScan();
  }
);`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  CLI Deployment Command
                </h4>
                <p className="text-slate-400">To deploy the scheduled reminder function to your Firebase project:</p>
                <div className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs select-all">
                  firebase deploy --only functions
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
