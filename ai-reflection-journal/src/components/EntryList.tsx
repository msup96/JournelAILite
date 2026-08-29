import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Heart,
  Calendar,
  Sparkles,
  Tag,
  PlusCircle,
  Clock,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { MOODS } from "../lib/constants";
import type { JournalEntry, MoodType } from "../types";

interface EntryListProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onToggleFavorite: (entry: JournalEntry) => void;
  loading: boolean;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  onToggleFavorite,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodType | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Collect all unique tags across entries
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filtered & Sorted entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(q);
          const matchContent = entry.content.toLowerCase().includes(q);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        // Mood filter
        if (selectedMood !== "all" && entry.mood !== selectedMood) {
          return false;
        }

        // Tag filter
        if (selectedTag !== "all" && !entry.tags?.includes(selectedTag)) {
          return false;
        }

        // Favorites filter
        if (onlyFavorites && !entry.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [entries, searchQuery, selectedMood, selectedTag, onlyFavorites, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Reflection Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {entries.length} {entries.length === 1 ? "reflection" : "reflections"} recorded • Private & isolated to your account
          </p>
        </div>

        <button
          id="entry-list-new-btn"
          onClick={onNewEntry}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs sm:text-sm shadow-sm shadow-indigo-500/25 hover:shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md mb-8 space-y-4">
        {/* Search input & Favorites / Sort toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-entries-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts, keywords, or topics..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Favorites Toggle */}
            <button
              id="filter-favorites-btn"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                onlyFavorites
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>Favorites</span>
            </button>

            {/* Sort Order Toggle */}
            <button
              id="filter-sort-order-btn"
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>

        {/* Mood Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMood("all")}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              selectedMood === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
            }`}
          >
            All Moods
          </button>
          {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
            const config = MOODS[mKey];
            const isSel = selectedMood === mKey;
            return (
              <button
                key={mKey}
                onClick={() => setSelectedMood(mKey)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  isSel
                    ? `${config.bgLight} ${config.bgDark} border ${config.borderColor} font-semibold ring-1 ring-indigo-500`
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters if tags exist */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Tag className="w-3 h-3" />
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                selectedTag === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                  selectedTag === t
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-850 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEntries.length === 0 && (
        <div
          id="empty-journal-state"
          className="text-center py-16 px-4 max-w-md mx-auto rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md"
        >
          <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {searchQuery || selectedMood !== "all" || onlyFavorites
              ? "No matching reflections"
              : "Your journal is waiting"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
            {searchQuery || selectedMood !== "all" || onlyFavorites
              ? "Try clearing your filters or search query to see other entries."
              : "Capture your thoughts, celebrate small wins, and let Gemini AI synthesize your inner growth."}
          </p>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Write First Reflection</span>
          </button>
        </div>
      )}

      {/* Entries Cards Grid */}
      {!loading && filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const moodCfg = MOODS[entry.mood] || MOODS.good;
            const dateStr = new Date(entry.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const hasAiReflection = Boolean(entry.aiSummary || entry.reflectionData);

            return (
              <div
                key={entry.id}
                id={`journal-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className="group relative rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 backdrop-blur-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  {/* Card Header: Mood Badge & Date & Favorite */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${moodCfg.bgLight} ${moodCfg.bgDark} border ${moodCfg.borderColor}`}
                    >
                      <span>{moodCfg.emoji}</span>
                      <span>{moodCfg.label.split(" ")[0]}</span>
                      <span className="opacity-75 font-normal">({entry.moodScore})</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-[11px]">{dateStr}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(entry);
                        }}
                        className={`p-1 rounded-lg transition-colors hover:text-rose-500 ${
                          entry.isFavorite ? "text-rose-500" : "text-slate-300 dark:text-slate-600"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${entry.isFavorite ? "fill-rose-500" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                    {entry.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {entry.content}
                  </p>
                </div>

                {/* Card Footer: AI Tag, Tags & View details */}
                <div>
                  {hasAiReflection && (
                    <div className="mb-3 p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 dark:border-indigo-900/40 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-indigo-950 dark:text-indigo-300 font-medium line-clamp-1">
                        {entry.aiSummary || entry.reflectionData?.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {entry.tags?.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[80px]"
                        >
                          #{t}
                        </span>
                      ))}
                      {entry.tags && entry.tags.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{entry.tags.length - 2}</span>
                      )}
                    </div>

                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Read Entry →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
