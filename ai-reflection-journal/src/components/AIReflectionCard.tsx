import React, { useState } from "react";
import {
  Sparkles,
  Quote,
  Lightbulb,
  Compass,
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from "lucide-react";
import type { AIReflectionData } from "../types";

interface AIReflectionCardProps {
  reflection: AIReflectionData;
  isLoading?: boolean;
}

export const AIReflectionCard: React.FC<AIReflectionCardProps> = ({ reflection, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    const text = `Gemini AI Reflection:
Summary: ${reflection.summary}
Key Themes: ${reflection.keyThemes.join(", ")}
Insights: ${reflection.insights}
Questions for Reflection:
${reflection.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
Micro Practice: ${reflection.microAction}
"${reflection.wisdomQuote.quote}" - ${reflection.wisdomQuote.author}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utteranceText = `${reflection.summary}. Key themes are ${reflection.keyThemes.join(", ")}. ${reflection.insights}. Here is a reflection question: ${reflection.questions[0]}. Micro practice: ${reflection.microAction}.`;
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div
        id="ai-reflection-loading"
        className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-6 sm:p-8 animate-pulse backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-800 dark:text-indigo-200 animate-spin">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="h-4 w-40 bg-indigo-200 dark:bg-indigo-800 rounded mb-1.5" />
            <div className="h-3 w-56 bg-indigo-100 dark:bg-indigo-900 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="ai-reflection-card"
      className="relative rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-500/5 via-slate-50/50 to-white/90 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 p-6 sm:p-8 overflow-hidden backdrop-blur-md transition-colors"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-indigo-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Gemini Reflection Synthesis
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                AI Insight
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Empathetic perspective & cognitive reframing
            </p>
          </div>
        </div>

        {/* Header Actions: Read aloud, Copy */}
        <div className="flex items-center gap-1.5">
          {"speechSynthesis" in window && (
            <button
              id="tts-toggle-btn"
              onClick={handleToggleSpeech}
              className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                isSpeaking
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isSpeaking ? "Stop Voice Reading" : "Listen to AI Reflection"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <button
            id="copy-ai-reflection-btn"
            onClick={handleCopy}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            title="Copy reflection text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="mt-5 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60">
        <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
          {reflection.summary}
        </p>
      </div>

      {/* Key Themes Chips */}
      {reflection.keyThemes && reflection.keyThemes.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Themes:
          </span>
          {reflection.keyThemes.map((theme, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60"
            >
              #{theme}
            </span>
          ))}
        </div>
      )}

      {/* Deep Psychological Insights */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Mindful Reframing & Perspective</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {reflection.insights}
        </p>
      </div>

      {/* Probing Reflection Questions */}
      {reflection.questions && reflection.questions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Questions for Your Next Reflection</span>
          </div>
          <ul className="space-y-2.5">
            {reflection.questions.map((question, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="italic">"{question}"</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Micro Grounding Action */}
      {reflection.microAction && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-900/40 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Suggested Micro-Practice
            </h5>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              {reflection.microAction}
            </p>
          </div>
        </div>
      )}

      {/* Wisdom Quote */}
      {reflection.wisdomQuote?.quote && (
        <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-start gap-3">
          <Quote className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 opacity-60" />
          <div>
            <p className="text-xs sm:text-sm italic text-slate-700 dark:text-slate-300">
              "{reflection.wisdomQuote.quote}"
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              — {reflection.wisdomQuote.author}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
