import React, { useState } from "react";
import {
  X,
  Sparkles,
  Heart,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Share2,
  Check,
  Smile,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MOODS } from "../lib/constants";
import { AIReflectionCard } from "./AIReflectionCard";
import type { JournalEntry } from "../types";

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onToggleFavorite: (entry: JournalEntry) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen || !entry) return null;

  const moodConfig = MOODS[entry.mood] || MOODS.good;
  const dateObj = new Date(entry.createdAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const wordCount = entry.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleShare = () => {
    navigator.clipboard.writeText(
      `${entry.title}\n${formattedDate}\n\n${entry.content}\n\n[Mood: ${moodConfig.label}]`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utter = new SpeechSynthesisUtterance(`${entry.title}. ${entry.content}`);
      utter.rate = 0.95;
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="entry-detail-modal"
        className="relative w-full max-w-3xl max-h-[90vh] bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xs">
          {/* Mood Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${moodConfig.bgLight} ${moodConfig.bgDark} border ${moodConfig.borderColor}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
              <span className="opacity-75">({entry.moodScore}/10)</span>
            </span>

            {entry.isFavorite && (
              <span className="flex items-center gap-1 text-rose-500 text-xs font-medium bg-rose-500/10 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-500/20">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                Favorite
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              id="modal-toggle-favorite-btn"
              onClick={() => onToggleFavorite(entry)}
              className={`p-2 rounded-xl text-xs transition-colors ${
                entry.isFavorite
                  ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 ${entry.isFavorite ? "fill-rose-500" : ""}`} />
            </button>

            {"speechSynthesis" in window && (
              <button
                id="modal-read-aloud-btn"
                onClick={handleToggleAudio}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  isSpeaking
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Read entry aloud"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              id="modal-share-btn"
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy entry"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              id="modal-edit-btn"
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Entry"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id="modal-delete-btn"
              onClick={() => {
                if (confirm("Are you sure you want to delete this reflection? This cannot be undone.")) {
                  onClose();
                  onDelete(entry.id);
                }
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="modal-close-btn"
              onClick={() => {
                if (isSpeaking && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Metadata & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedTime}
              </span>
              <span>•</span>
              <span>
                {wordCount} words ({readingTime} min)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {entry.title}
            </h2>
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {entry.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Main Content Body */}
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-serif sm:font-sans pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            {entry.content}
          </div>

          {/* AI Reflection Analysis Card */}
          {(entry.reflectionData || entry.aiSummary) && (
            <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/80">
              <AIReflectionCard
                reflection={
                  entry.reflectionData || {
                    summary: entry.aiSummary || "",
                    keyThemes: entry.tags || [],
                    insights: entry.aiInsights || "",
                    questions: entry.aiQuestions ? entry.aiQuestions.split(" | ") : [],
                    microAction: "Take a quiet breath and acknowledge your inner honesty.",
                    wisdomQuote: {
                      quote: "The unexamined life is not worth living.",
                      author: "Socrates",
                    },
                  }
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
