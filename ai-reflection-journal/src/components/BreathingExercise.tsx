import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface BreathingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = "Inhale" | "Hold" | "Exhale" | "Rest";

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("Inhale");
  const [countdown, setCountdown] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context for gentle harmonic tone
  const playGentleTone = (freq = 440) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.6);
    } catch (e) {
      // Audio context might fail without user gesture, graceful fallback
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Transition phase
            if (phase === "Inhale") {
              setPhase("Hold");
              playGentleTone(520);
              return 7;
            } else if (phase === "Hold") {
              setPhase("Exhale");
              playGentleTone(390);
              return 8;
            } else {
              setPhase("Inhale");
              setCompletedCycles((c) => c + 1);
              playGentleTone(440);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, phase]);

  const handleToggle = () => {
    if (!isActive) {
      playGentleTone(440);
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase("Inhale");
    setCountdown(4);
    setCompletedCycles(0);
  };

  if (!isOpen) return null;

  const phaseInstruction = {
    Inhale: "Breathe in deeply through your nose...",
    Hold: "Hold your breath softly. Be still...",
    Exhale: "Release completely through your mouth...",
    Rest: "Rest peacefully...",
  }[phase];

  const circleScale =
    phase === "Inhale"
      ? "scale-125 duration-4000"
      : phase === "Hold"
      ? "scale-125 duration-7000"
      : "scale-80 duration-8000";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="breathing-modal-card"
        className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden backdrop-blur-xl"
      >
        {/* Close button */}
        <button
          id="close-breathing-modal-btn"
          onClick={() => {
            setIsActive(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Description */}
        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>4-7-8 Mindful Grounding</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          Center Your Mind
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-8">
          A tranquil breathwork ritual to calm your nervous system before or after reflecting.
        </p>

        {/* Breathing Animation Canvas */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Outer glow rings */}
          <div
            className={`absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 transition-all ease-in-out ${circleScale}`}
          />
          <div
            className={`absolute inset-4 rounded-full bg-cyan-500/15 dark:bg-cyan-400/15 transition-all ease-in-out ${circleScale}`}
          />

          {/* Central Pulse Sphere */}
          <div
            className={`w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/25 flex flex-col items-center justify-center text-white transition-all ease-in-out ${circleScale}`}
          >
            <span className="text-3xl font-extrabold tracking-tight font-mono">
              {isActive ? countdown : "Ready"}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider opacity-90 mt-0.5">
              {isActive ? phase : "4-7-8"}
            </span>
          </div>
        </div>

        {/* Live Prompt Guidance */}
        <div className="h-10 mb-6 flex items-center justify-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-opacity">
            {isActive ? phaseInstruction : "Press Start when you are ready to breathe."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-breathing-btn"
            onClick={handleToggle}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-md cursor-pointer ${
              isActive
                ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-500/25"
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? "Pause" : "Start Session"}</span>
          </button>

          <button
            id="reset-breathing-btn"
            onClick={handleReset}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Completed Cycles Badge */}
        {completedCycles > 0 && (
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-4">
            ✓ {completedCycles} mindful breath {completedCycles === 1 ? "cycle" : "cycles"} completed
          </p>
        )}
      </div>
    </div>
  );
};
