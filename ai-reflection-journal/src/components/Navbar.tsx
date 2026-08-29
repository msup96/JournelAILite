import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Flame,
  PlusCircle,
  BarChart3,
  Lightbulb,
  Wind,
  Moon,
  Sun,
  LogOut,
  LogIn,
  User as UserIcon,
  MessageSquareHeart,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  currentTab: "journal" | "entries" | "analytics" | "prompts" | "chat";
  onTabChange: (tab: "journal" | "entries" | "analytics" | "prompts" | "chat") => void;
  onOpenBreathing: () => void;
  onOpenNewEntry: () => void;
  onOpenReminders: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenBreathing,
  onOpenNewEntry,
  onOpenReminders,
  darkMode,
  onToggleDarkMode,
}) => {
  const { user, userProfile, signIn, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const streak = userProfile?.currentStreak || 0;

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => onTabChange("entries")}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">
                  Reflect
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold tracking-wider uppercase">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none mt-0.5">
                Mindful AI Journal
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-tab-entries"
              onClick={() => onTabChange("entries")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === "entries"
                  ? "bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              My Entries
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => onTabChange("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === "analytics"
                  ? "bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              Insights & Moods
            </button>
            <button
              id="nav-tab-prompts"
              onClick={() => onTabChange("prompts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === "prompts"
                  ? "bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Prompts
            </button>
            <button
              id="nav-tab-chat"
              onClick={() => onTabChange("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === "chat"
                  ? "bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-cyan-500" />
              AI Sounding Board
            </button>
          </nav>
        </div>

        {/* Right Actions: Streak, Breathing, New Entry, Dark Mode, Auth */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          {user && (
            <div
              id="streak-badge-pill"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold backdrop-blur-xs"
              title={`${streak} day mindful reflection streak`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streak}d streak</span>
            </div>
          )}

          {/* Mindful Breathing Trigger */}
          <button
            id="mindful-breathing-btn"
            onClick={onOpenBreathing}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="Mindful 4-7-8 Breathing"
          >
            <Wind className="w-4 h-4" />
          </button>

          {/* Daily Email Reminder Settings Trigger */}
          <button
            id="reminder-settings-btn"
            onClick={onOpenReminders}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="24-Hour Automated Email Reminders"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="darkmode-toggle-btn"
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 scale-100" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform rotate-0 scale-100" />
            )}
          </button>

          {/* New Reflection Button */}
          <button
            id="new-reflection-btn"
            onClick={onOpenNewEntry}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs tracking-wide shadow-sm shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Write Entry</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-none"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-semibold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {dropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.displayName || "Mindful Author"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="p-1">
                    <button
                      id="dropdown-streak-info"
                      onClick={() => {
                        setDropdownOpen(false);
                        onTabChange("analytics");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        Reflections Streak
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {streak} days
                      </span>
                    </button>
                    <button
                      id="dropdown-reminders-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenReminders();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        Daily Email Reminders
                      </span>
                      <span className="text-[10px] uppercase font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        24h
                      </span>
                    </button>
                    <button
                      id="dropdown-signout-btn"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={signIn}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white shadow-sm transition-all active:scale-98"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <button
          id="mobile-tab-entries"
          onClick={() => onTabChange("entries")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium ${
            currentTab === "entries"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          Entries
        </button>
        <button
          id="mobile-tab-new-entry"
          onClick={onOpenNewEntry}
          className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
        >
          <PlusCircle className="w-4 h-4 mb-0.5" />
          Write
        </button>
        <button
          id="mobile-tab-analytics"
          onClick={() => onTabChange("analytics")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium ${
            currentTab === "analytics"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          Insights
        </button>
        <button
          id="mobile-tab-prompts"
          onClick={() => onTabChange("prompts")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium ${
            currentTab === "prompts"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Lightbulb className="w-4 h-4 mb-0.5" />
          Prompts
        </button>
        <button
          id="mobile-tab-chat"
          onClick={() => onTabChange("chat")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium ${
            currentTab === "chat"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <MessageSquareHeart className="w-4 h-4 mb-0.5" />
          Companion
        </button>
      </div>
    </header>
  );
};
