export type MoodType =
  | "great"
  | "good"
  | "grateful"
  | "reflective"
  | "energized"
  | "neutral"
  | "anxious"
  | "stressed"
  | "sad";

export interface MoodConfig {
  type: MoodType;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
}

export interface AIReflectionData {
  summary: string;
  keyThemes: string[];
  insights: string;
  questions: string[];
  microAction: string;
  wisdomQuote: {
    quote: string;
    author: string;
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  content: string;
  mood: MoodType;
  moodScore: number;
  tags: string[];
  isFavorite: boolean;
  aiSummary?: string;
  aiInsights?: string;
  aiQuestions?: string;
  audioTranscript?: string;
  reflectionData?: AIReflectionData;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  currentStreak?: number;
  lastEntryDate?: string;
  lastEntryTimestamp?: number;
  themePreference?: "light" | "dark" | "system";
  reflectionFocus?: string;
  emailRemindersEnabled?: boolean;
  reminderTime?: string; // e.g. "09:00", "13:00", "20:00"
  reminderTimezone?: string;
  lastReminderSentAt?: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderLog {
  id: string;
  userId: string;
  userEmail: string;
  sentAt: string; // ISO string
  hoursSinceLastEntry: number;
  streakAtTime: number;
  promptIncluded: string;
  status: "delivered" | "queued" | "skipped";
  reason?: string;
  deliveryMethod: "email_smtp" | "cloud_function_cron" | "firestore_trigger_mail" | "simulation";
}

export interface ReminderScanResult {
  timestamp: string;
  totalUsersChecked: number;
  inactiveUsersFound: number;
  remindersSent: number;
  remindersSkipped: number;
  logs: ReminderLog[];
}

export interface GrowthReportData {
  moodTrajectory: string;
  topPatterns: string[];
  milestones: string[];
  recommendations: string[];
  overallAffirmation: string;
  averageEnergyLevel: string;
}

export interface GuidedPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  estimatedMinutes: number;
  moodCategory: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
