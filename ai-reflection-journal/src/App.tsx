import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { db, handleFirestoreError } from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { EntryList } from "./components/EntryList";
import { JournalEditor } from "./components/JournalEditor";
import { AnalyticsView } from "./components/AnalyticsView";
import { PromptLibrary } from "./components/PromptLibrary";
import { CompanionView } from "./components/CompanionView";
import { BreathingExercise } from "./components/BreathingExercise";
import { EntryDetailModal } from "./components/EntryDetailModal";
import { ReminderSettingsModal } from "./components/ReminderSettingsModal";
import { LandingView } from "./components/LandingView";
import { OperationType, type JournalEntry, type GuidedPrompt } from "./types";

function MainApp() {
  const { user, userProfile, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<
    "journal" | "entries" | "analytics" | "prompts" | "chat"
  >("entries");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Modals & Active selections
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  // Dark mode with proper priority for saved preference > user profile > system preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("reflect_theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Sync documentElement 'dark' class with darkMode state
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("reflect_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("reflect_theme", "light");
    }
  }, [darkMode]);

  // Sync with user's Firestore profile preference if available
  useEffect(() => {
    if (userProfile?.themePreference) {
      if (userProfile.themePreference === "dark" && !darkMode) {
        setDarkMode(true);
      } else if (userProfile.themePreference === "light" && darkMode) {
        setDarkMode(false);
      }
    }
  }, [userProfile?.themePreference]);

  // Listen to OS theme changes if user hasn't explicitly set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("reflect_theme");
      if (!saved) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Real-time Firestore entries listener for the authenticated user
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }

    setLoadingEntries(true);
    const entriesRef = collection(db, "entries");
    // Query filtered strictly by userId with indexed ordering
    const q = query(
      entriesRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as JournalEntry);
        });
        setEntries(fetched);
        setLoadingEntries(false);
      },
      (error) => {
        console.error("Firestore real-time subscription error:", error);
        handleFirestoreError(error, OperationType.LIST, "entries");
        setLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handler: Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, "entries", entryId));
      if (selectedEntryForDetail?.id === entryId) {
        setSelectedEntryForDetail(null);
      }
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      handleFirestoreError(err, OperationType.DELETE, `entries/${entryId}`);
    }
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = async (entry: JournalEntry) => {
    try {
      const nextFav = !entry.isFavorite;
      await updateDoc(doc(db, "entries", entry.id), {
        isFavorite: nextFav,
        updatedAt: new Date().toISOString(),
      });
      if (selectedEntryForDetail?.id === entry.id) {
        setSelectedEntryForDetail({ ...entry, isFavorite: nextFav });
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      handleFirestoreError(err, OperationType.UPDATE, `entries/${entry.id}`);
    }
  };

  // Handler: Open editor with a specific prompt spark
  const handleUsePrompt = (promptItem: GuidedPrompt) => {
    setEditingEntry({
      id: "",
      userId: user?.uid || "",
      userEmail: user?.email || "",
      title: promptItem.title,
      content: `[Prompt: ${promptItem.prompt}]\n\n`,
      mood: "reflective",
      moodScore: 7,
      tags: [promptItem.moodCategory, "PromptSpark"],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setCurrentTab("journal");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
          <p className="text-xs font-medium tracking-wider uppercase text-slate-400">
            Initializing your sanctuary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
      {/* Sleek ambient background illumination */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-950/20 dark:to-transparent blur-3xl opacity-70" />
      </div>

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setEditingEntry(null);
          setCurrentTab(tab);
        }}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onOpenNewEntry={() => {
          setEditingEntry(null);
          setCurrentTab("journal");
        }}
        onOpenReminders={() => setIsRemindersOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16 md:pb-8">
        {!user ? (
          <LandingView />
        ) : (
          <>
            {currentTab === "journal" && (
              <JournalEditor
                initialEntry={editingEntry}
                onSaved={(saved) => {
                  setEditingEntry(null);
                  setSelectedEntryForDetail(saved);
                  setCurrentTab("entries");
                }}
                onCancel={() => {
                  setEditingEntry(null);
                  setCurrentTab("entries");
                }}
              />
            )}

            {currentTab === "entries" && (
              <EntryList
                entries={entries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onNewEntry={() => {
                  setEditingEntry(null);
                  setCurrentTab("journal");
                }}
                onToggleFavorite={handleToggleFavorite}
                loading={loadingEntries}
              />
            )}

            {currentTab === "analytics" && <AnalyticsView entries={entries} />}

            {currentTab === "prompts" && <PromptLibrary onUsePrompt={handleUsePrompt} />}

            {currentTab === "chat" && <CompanionView recentEntries={entries} />}
          </>
        )}
      </main>

      {/* Modals */}
      <BreathingExercise isOpen={isBreathingOpen} onClose={() => setIsBreathingOpen(false)} />

      <ReminderSettingsModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        entries={entries}
      />

      <EntryDetailModal
        entry={selectedEntryForDetail}
        isOpen={Boolean(selectedEntryForDetail)}
        onClose={() => setSelectedEntryForDetail(null)}
        onEdit={(entry) => {
          setSelectedEntryForDetail(null);
          setEditingEntry(entry);
          setCurrentTab("journal");
        }}
        onDelete={handleDeleteEntry}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
