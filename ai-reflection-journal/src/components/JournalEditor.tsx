import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Save,
  Tag,
  Smile,
  Lightbulb,
  Check,
  ChevronRight,
  AlertCircle,
  Sliders,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { MOODS, POPULAR_TAGS, DEFAULT_PROMPTS } from "../lib/constants";
import { AIReflectionCard } from "./AIReflectionCard";
import {
  OperationType,
  type MoodType,
  type JournalEntry,
  type AIReflectionData,
  type GuidedPrompt,
} from "../types";

interface JournalEditorProps {
  initialEntry?: JournalEntry | null;
  onSaved: (entry: JournalEntry) => void;
  onCancel?: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  initialEntry,
  onSaved,
  onCancel,
}) => {
  const { user, updateStreakOnNewEntry } = useAuth();

  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || "good");
  const [moodScore, setMoodScore] = useState<number>(initialEntry?.moodScore || 7);
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ["Mindfulness"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [reflection, setReflection] = useState<AIReflectionData | null>(
    initialEntry?.reflectionData ||
      (initialEntry?.aiSummary
        ? {
            summary: initialEntry.aiSummary,
            keyThemes: initialEntry.tags || [],
            insights: initialEntry.aiInsights || "",
            questions: initialEntry.aiQuestions ? [initialEntry.aiQuestions] : [],
            microAction: "Take three slow conscious breaths.",
            wisdomQuote: { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
          }
        : null)
  );

  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Auto-restore draft from localStorage for new entries
  useEffect(() => {
    if (!initialEntry) {
      const savedDraft = localStorage.getItem("reflect_journal_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.content && !content) {
            setTitle(parsed.title || "");
            setContent(parsed.content || "");
            if (parsed.mood) setMood(parsed.mood);
            if (parsed.tags) setTags(parsed.tags);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [initialEntry]);

  // Auto-save draft locally while editing
  useEffect(() => {
    if (!initialEntry && (content || title)) {
      const timeout = setTimeout(() => {
        localStorage.setItem(
          "reflect_journal_draft",
          JSON.stringify({ title, content, mood, tags, updatedAt: new Date().toISOString() })
        );
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [title, content, mood, tags, initialEntry]);

  // Voice Dictation Speech-to-Text logic
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + " ";
            }
          }
          if (transcript) {
            setContent((prev) => (prev ? prev.trim() + " " + transcript.trim() : transcript.trim()));
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsRecording(false);
      }
    }
  };

  // Trigger Gemini AI Reflection
  const handleGenerateAIReflection = async () => {
    if (!content.trim()) {
      setErrorMsg("Please write some reflection content before asking Gemini AI for insights.");
      return;
    }
    setErrorMsg(null);
    setIsReflecting(true);

    try {
      const response = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Reflection",
          content: content.trim(),
          mood,
          moodScore,
          tags,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate reflection.");
      }

      const data: AIReflectionData = await response.json();
      setReflection(data);
    } catch (err: any) {
      console.error("AI reflection error:", err);
      setErrorMsg(err.message || "Failed to generate reflection analysis. Please try again.");
    } finally {
      setIsReflecting(false);
    }
  };

  // Tag Helpers
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Insert guided prompt
  const handleInsertPrompt = (promptItem: GuidedPrompt) => {
    if (!title) {
      setTitle(promptItem.title);
    }
    setContent((prev) =>
      prev
        ? `${prev}\n\n[Prompt: ${promptItem.prompt}]\n`
        : `[Prompt: ${promptItem.prompt}]\n\n`
    );
    setShowPromptDrawer(false);
  };

  // Save entry to Firestore
  const handleSaveEntry = async () => {
    if (!user) {
      setErrorMsg("Please sign in to save your private journal entries.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Please write some reflection content before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const entryId = initialEntry?.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalTitle = title.trim() || `Reflection on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const nowIso = new Date().toISOString();

    const entryData: JournalEntry = {
      id: entryId,
      userId: user.uid,
      userEmail: user.email || "",
      title: finalTitle,
      content: content.trim(),
      mood,
      moodScore,
      tags: tags.slice(0, 10),
      isFavorite: initialEntry?.isFavorite || false,
      aiSummary: reflection?.summary || "",
      aiInsights: reflection?.insights || "",
      aiQuestions: reflection?.questions?.join(" | ") || "",
      reflectionData: reflection || undefined,
      createdAt: initialEntry?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      const docPath = `entries/${entryId}`;
      const entryDocRef = doc(db, "entries", entryId);
      await setDoc(entryDocRef, entryData);

      // Update streak
      await updateStreakOnNewEntry();

      // Clear local draft
      localStorage.removeItem("reflect_journal_draft");

      // Celebrate with subtle confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#0d9488", "#10b981", "#f59e0b", "#6366f1"],
        });
      } catch (e) {
        // Confetti optional
      }

      onSaved(entryData);
    } catch (err: any) {
      console.error("Save error:", err);
      handleFirestoreError(err, initialEntry ? OperationType.UPDATE : OperationType.CREATE, `entries/${entryId}`);
      setErrorMsg("Failed to save entry to database. Please verify connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {initialEntry ? "Edit Reflection" : "New Reflection Entry"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            • {wordCount} words ({readingTime} min read)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-guided-prompts-btn"
            onClick={() => setShowPromptDrawer(!showPromptDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Guided Prompts</span>
          </button>

          {onCancel && (
            <button
              id="cancel-editor-btn"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            id="save-entry-btn"
            onClick={handleSaveEntry}
            disabled={isSaving || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 text-xs font-semibold shadow-xs hover:shadow transition-all active:scale-98 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Entry"}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div
          id="editor-error-alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Guided Prompt Drawer (Collapsible) */}
      {showPromptDrawer && (
        <div
          id="guided-prompts-drawer"
          className="mb-6 p-5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Choose a Mindfulness Spark
            </h4>
            <button
              onClick={() => setShowPromptDrawer(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleInsertPrompt(item)}
                className="p-3 text-left rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  <span>{item.title}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    {item.estimatedMinutes}m
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood Selector Section */}
      <div className="mb-6 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Current Emotional Resonance
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Intensity: <strong className="text-indigo-600 dark:text-indigo-400">{moodScore}/10</strong>
          </span>
        </div>

        {/* 9 Mood Chips */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 mb-4">
          {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
            const config = MOODS[mKey];
            const isSelected = mood === mKey;
            return (
              <button
                key={mKey}
                type="button"
                id={`mood-btn-${mKey}`}
                onClick={() => setMood(mKey)}
                className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                  isSelected
                    ? `${config.bgLight} ${config.bgDark} ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xs font-semibold scale-102`
                    : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/80"
                }`}
              >
                <span className="text-xl">{config.emoji}</span>
                <span className="text-[10px] leading-tight line-clamp-1">{config.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Intensity Range Slider */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Gentle (1)</span>
          <input
            type="range"
            min="1"
            max="10"
            value={moodScore}
            onChange={(e) => setMoodScore(parseInt(e.target.value))}
            className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Intense (10)</span>
        </div>
      </div>

      {/* Main Journal Title and Writing Area */}
      <div className="space-y-4 mb-6">
        <input
          id="journal-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title your reflection or leave blank for auto-title..."
          maxLength={200}
          className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 pb-2 focus:ring-0 focus:outline-none focus:border-indigo-600 transition-colors"
        />

        <div className="relative rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 backdrop-blur-md transition-all">
          <textarea
            id="journal-content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely without judgment. What thoughts, sensations, or realizations are present right now? What happened today? How did you respond?..."
            rows={12}
            maxLength={15000}
            className="w-full p-5 sm:p-6 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm sm:text-base leading-relaxed resize-none focus:outline-none"
          />

          {/* Bottom Editor Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl">
            <div className="flex items-center gap-2">
              {/* Voice Dictation Button */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
                title={isRecording ? "Stop dictation" : "Dictate with voice"}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                <span>{isRecording ? "Listening..." : "Voice Dictate"}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                {content.length} / 15,000 chars
              </span>
            </div>

            {/* AI Reflect Button */}
            <button
              id="ai-reflect-button"
              type="button"
              onClick={handleGenerateAIReflection}
              disabled={isReflecting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-xs shadow-indigo-500/25 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
            >
              {isReflecting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isReflecting ? "Gemini Synthesizing..." : "Reflect with Gemini AI"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tags Selector */}
      <div className="mb-8 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Tags & Life Spheres
        </label>

        {/* Selected Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-900/40"
            >
              #{t}
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-600 dark:hover:text-rose-400 ml-1 text-xs"
              >
                ×
              </button>
            </span>
          ))}

          {/* New Tag Input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              placeholder="+ Add tag..."
              maxLength={30}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-24"
            />
          </div>
        </div>

        {/* Popular Tags suggestions */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 mr-1">Suggestions:</span>
          {POPULAR_TAGS.map((pt) => {
            const isAdded = tags.includes(pt);
            return (
              <button
                key={pt}
                type="button"
                disabled={isAdded}
                onClick={() => handleAddTag(pt)}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  isAdded
                    ? "opacity-40 cursor-default text-slate-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                +{pt}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Reflection Output Card */}
      {(reflection || isReflecting) && (
        <div className="mb-8">
          <AIReflectionCard reflection={reflection!} isLoading={isReflecting} />
        </div>
      )}

      {/* Bottom Floating Save Bar on Mobile */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between">
        <span className="text-xs text-slate-500">{wordCount} words</span>
        <button
          onClick={handleSaveEntry}
          disabled={isSaving || !content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? "Saving..." : "Save Entry"}</span>
        </button>
      </div>
    </div>
  );
};
