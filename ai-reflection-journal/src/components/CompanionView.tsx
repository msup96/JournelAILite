import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import type { ChatMessage, JournalEntry } from "../types";
import { useAuth } from "../context/AuthContext";

interface CompanionViewProps {
  recentEntries: JournalEntry[];
}

export const CompanionView: React.FC<CompanionViewProps> = ({ recentEntries }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      role: "assistant",
      content: `Welcome to your mindful sounding board. I am Sophia, your reflective companion.\n\nTake a gentle breath. What thoughts or feelings are calling for your attention today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntryContext, setSelectedEntryContext] = useState<JournalEntry | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/mentor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          entryContext: selectedEntryContext
            ? {
                title: selectedEntryContext.title,
                mood: selectedEntryContext.mood,
                content: selectedEntryContext.content,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Companion conversation failed.");
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I am here with you. Please continue sharing.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I ran into a temporary hiccup connecting to the reflection mentor. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "initial-reset",
        role: "assistant",
        content: `I am here. Take your time. What is on your mind right now?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              AI Sounding Board
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/20">
                Sophia Mentor
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A private, non-judgmental conversational space for reflection
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 cursor-pointer"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Context Selection Pill if entries exist */}
      {recentEntries.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              Active Context:
            </span>
            <span className="truncate">
              {selectedEntryContext ? selectedEntryContext.title : "No specific entry attached"}
            </span>
          </div>

          <select
            value={selectedEntryContext?.id || ""}
            onChange={(e) => {
              const found = recentEntries.find((ent) => ent.id === e.target.value);
              setSelectedEntryContext(found || null);
            }}
            className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">General (No entry attached)</option>
            {recentEntries.slice(0, 8).map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.title} ({ent.mood})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-3xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 mb-4 backdrop-blur-xs">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs"
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                  isUser
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-xs"
                    : "bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs backdrop-blur-xs"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-2xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 rounded-tl-xs">
              Sophia is gently reflecting on your thoughts...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starters */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0">
          <span className="text-[11px] text-slate-400 shrink-0">Try asking:</span>
          {[
            "Help me untangle what I'm feeling right now",
            "I'm feeling overwhelmed by decisions today",
            "Guide me through a 2-minute gratitude practice",
          ].map((quick, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(quick)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {quick}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          id="companion-chat-input"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Share your thoughts with Sophia..."
          className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs backdrop-blur-md"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
