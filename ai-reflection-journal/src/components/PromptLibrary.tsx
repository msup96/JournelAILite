import React, { useState } from "react";
import {
  Lightbulb,
  Sparkles,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Heart,
  Target,
  Compass,
  Smile,
} from "lucide-react";
import { DEFAULT_PROMPTS } from "../lib/constants";
import type { GuidedPrompt } from "../types";

interface PromptLibraryProps {
  onUsePrompt: (prompt: GuidedPrompt) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Sparks", icon: Sparkles },
  { id: "morning", label: "Morning Intentions", icon: Sun },
  { id: "evening", label: "Evening Unwind", icon: Moon },
  { id: "gratitude", label: "Gratitude & Joy", icon: Heart },
  { id: "clarity", label: "Clarity & Decisions", icon: Compass },
  { id: "growth", label: "Purpose & Growth", icon: Target },
];

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onUsePrompt }) => {
  const [prompts, setPrompts] = useState<GuidedPrompt[]>(DEFAULT_PROMPTS);
  const [selectedCat, setSelectedCat] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate personalized prompts via Gemini API
  const handleGenerateCustomPrompts = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/gemini/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCat === "all" ? "mindful_growth" : selectedCat,
          currentMood: "Reflective",
          recentThemes: ["Self-Compassion", "Clarity", "Presence"],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate new prompts.");
      }

      const newPrompts: GuidedPrompt[] = await response.json();
      setPrompts((prev) => [...newPrompts, ...prev]);
    } catch (err: any) {
      console.error("Prompts generation error:", err);
      setErrorMsg(err.message || "Failed to generate prompts.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = selectedCat === "all"
    ? prompts
    : prompts.filter((p) =>
        p.moodCategory?.toLowerCase().includes(selectedCat.toLowerCase()) ||
        p.title.toLowerCase().includes(selectedCat.toLowerCase()) ||
        p.description.toLowerCase().includes(selectedCat.toLowerCase())
      );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Mindful Prompt Sparks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
              Inspiration
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thoughtfully crafted inquiries to unlock deeper layers of self-awareness.
          </p>
        </div>

        <button
          id="generate-ai-prompts-btn"
          onClick={handleGenerateCustomPrompts}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGenerating ? "Gemini Creating Sparks..." : "Generate AI Sparks"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSel = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSel
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                  : "bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            id={`prompt-card-${item.id}`}
            className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between backdrop-blur-md group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-slate-400 text-xs mb-3">
                <span className="px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
                  {item.moodCategory}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  ~{item.estimatedMinutes} min
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {item.description}
              </p>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 mb-6">
                <p className="text-xs sm:text-sm italic font-serif text-slate-900 dark:text-slate-200 leading-relaxed">
                  "{item.prompt}"
                </p>
              </div>
            </div>

            <button
              onClick={() => onUsePrompt(item)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-100 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-slate-900 text-xs font-semibold transition-all group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 cursor-pointer"
            >
              <span>Write with This Spark</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
