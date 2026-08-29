import React from "react";
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Mic,
  BarChart3,
  Heart,
  Quote,
  LogIn,
  Flame,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingView: React.FC = () => {
  const { signIn } = useAuth();

  return (
    <div className="max-w-5xl mx-auto py-12 sm:py-16 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by Gemini & Cloud Firestore</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight mb-6">
          Your Mindful Sanctuary for Inner Reflection & Growth
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
          Capture your authentic thoughts, track your emotional cadence, and receive compassionate, structured psychological insights synthesized by Gemini AI.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="landing-signin-btn"
            onClick={signIn}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/20 transition-all active:scale-98 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            100% User-Isolated & Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            Daily Mindfulness Streaks
          </span>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Gemini AI Reflection
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Transform unstructured journal entries into cognitive reframings, deeper reflection inquiries, and micro grounding actions.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Voice Dictation & Moods
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Dictate your reflections naturally with real-time speech transcription and tag your emotional resonance across 9 mindful states.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Growth Reports & Trends
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Understand recurring emotional themes, celebrate breakthroughs, and receive customized trajectory reports over time.
            </p>
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="p-8 rounded-3xl bg-indigo-500/5 dark:bg-indigo-950/30 border border-indigo-500/15 dark:border-indigo-900/40 text-center max-w-2xl mx-auto backdrop-blur-xs">
        <Quote className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mx-auto mb-3 opacity-75" />
        <p className="text-base sm:text-lg italic font-serif text-slate-900 dark:text-indigo-200 mb-2">
          "Knowing yourself is the beginning of all wisdom."
        </p>
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          — Aristotle
        </span>
      </div>
    </div>
  );
};
