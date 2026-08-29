import React, { useState } from "react";
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Flame,
  BookOpen,
  Heart,
  Award,
  Compass,
  CheckCircle2,
  Quote,
  Lightbulb,
} from "lucide-react";
import { MOODS } from "../lib/constants";
import type { JournalEntry, GrowthReportData, MoodType } from "../types";
import { useAuth } from "../context/AuthContext";

interface AnalyticsViewProps {
  entries: JournalEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ entries }) => {
  const { userProfile } = useAuth();
  const [growthReport, setGrowthReport] = useState<GrowthReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Statistics calculation
  const totalEntries = entries.length;
  const totalWords = entries.reduce((acc, curr) => acc + (curr.content ? curr.content.split(/\s+/).length : 0), 0);
  const averageMoodScore = totalEntries
    ? (entries.reduce((acc, curr) => acc + (curr.moodScore || 5), 0) / totalEntries).toFixed(1)
    : "0";
  const streak = userProfile?.currentStreak || 0;

  // Mood Frequency Count
  const moodCounts: Record<string, number> = {};
  entries.forEach((curr) => {
    moodCounts[curr.mood] = (moodCounts[curr.mood] || 0) + 1;
  });

  // Generate Growth Report via Gemini AI
  const handleGenerateReport = async () => {
    if (entries.length === 0) {
      setReportError("Write at least 1 reflection entry before generating an AI growth report.");
      return;
    }
    setReportError(null);
    setIsGeneratingReport(true);

    try {
      const response = await fetch("/api/gemini/growth-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate growth report from Gemini API.");
      }

      const data: GrowthReportData = await response.json();
      setGrowthReport(data);
    } catch (err: any) {
      console.error("Growth report generation error:", err);
      setReportError(err.message || "Failed to analyze entries.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Emotional Trends & Growth</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/20">
              Insights
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your inner patterns, emotional cadence, and psychological milestones.
          </p>
        </div>

        {/* AI Report Trigger Button */}
        <button
          id="generate-growth-report-btn"
          onClick={handleGenerateReport}
          disabled={isGeneratingReport || entries.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingReport ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGeneratingReport ? "Gemini Synthesizing Trends..." : "Generate AI Growth Report"}</span>
        </button>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Entries</span>
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            {totalEntries}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Written reflections</span>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mindful Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {streak} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Daily consistency</span>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Energy/Mood</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {averageMoodScore} <span className="text-sm font-normal text-slate-500">/ 10</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Intensity score</span>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Words Expressed</span>
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {totalWords.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total vocabulary logged</span>
        </div>
      </div>

      {/* Error alert if report failed */}
      {reportError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
          {reportError}
        </div>
      )}

      {/* Holistic AI Growth Report Panel */}
      {growthReport && (
        <div
          id="growth-report-card"
          className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/70 bg-gradient-to-br from-indigo-50/50 via-slate-50/50 to-white/90 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-slate-900/90 p-6 sm:p-8 shadow-xl shadow-indigo-500/5 space-y-6 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Holistic Growth & Trajectory Synthesis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesized across your recent reflection entries
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
              Energy: {growthReport.averageEnergyLevel}
            </span>
          </div>

          {/* Emotional Trajectory Overview */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs backdrop-blur-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Emotional Trajectory
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {growthReport.moodTrajectory}
            </p>
          </div>

          {/* Top Patterns & Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patterns */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs backdrop-blur-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                Observed Mindset Patterns
              </h4>
              <ul className="space-y-2">
                {growthReport.topPatterns.map((pattern, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Milestones */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs backdrop-blur-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Growth Breakthroughs
              </h4>
              <ul className="space-y-2">
                {growthReport.milestones.map((milestone, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations for Next Week */}
          <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Gentle Recommendations for Continued Growth
            </h4>
            <ul className="space-y-2">
              {growthReport.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-amber-900/90 dark:text-amber-300/90">
                  <span className="font-bold text-amber-600 dark:text-amber-400">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Affirmation */}
          {growthReport.overallAffirmation && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 dark:border-indigo-900 text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700 dark:text-indigo-400">
                Your Weekly Anchor Affirmation
              </span>
              <p className="text-sm sm:text-base font-serif italic text-slate-900 dark:text-slate-100 mt-1">
                "{growthReport.overallAffirmation}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mood Distribution & Recent Mood Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution Breakdown */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Mood Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Frequency of emotional states recorded
          </p>

          {totalEntries === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No entries logged yet to compute distribution.
            </p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
                const config = MOODS[mKey];
                const count = moodCounts[mKey] || 0;
                const percentage = totalEntries ? Math.round((count / totalEntries) * 100) : 0;

                if (count === 0) return null;

                return (
                  <div key={mKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                      </span>
                      <span className="text-slate-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Reflections Timeline preview */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Recent Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Chronological log of your recent entries
          </p>

          {entries.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No entries yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map((entry) => {
                const moodCfg = MOODS[entry.mood] || MOODS.good;
                const dateStr = new Date(entry.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xl shrink-0">{moodCfg.emoji}</span>
                      <div className="truncate">
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {entry.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
