import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, testFirestoreConnection } from "../lib/firebase";
import { OperationType, type UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateStreakOnNewEntry: () => Promise<number>;
  updateThemePreference: (theme: "light" | "dark" | "system") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Test initial connection
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Initialize new user profile document
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Mindful Journaler",
              photoURL: currentUser.photoURL || "",
              currentStreak: 0,
              lastEntryDate: "",
              themePreference: "system",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching or creating user profile:", error);
          // If error occurs, don't crash the entire auth state
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const updateStreakOnNewEntry = async (): Promise<number> => {
    if (!user) return 0;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const userDocRef = doc(db, "users", user.uid);
      const prevLastDate = userProfile?.lastEntryDate;
      const prevStreak = userProfile?.currentStreak || 0;

      let newStreak = prevStreak;
      if (!prevLastDate) {
        newStreak = 1;
      } else if (prevLastDate === todayStr) {
        newStreak = Math.max(1, prevStreak);
      } else {
        const prev = new Date(prevLastDate);
        const today = new Date(todayStr);
        const diffDays = Math.round((today.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          newStreak = prevStreak + 1;
        } else {
          newStreak = 1;
        }
      }

      await updateDoc(userDocRef, {
        currentStreak: newStreak,
        lastEntryDate: todayStr,
        updatedAt: new Date().toISOString(),
      });

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              currentStreak: newStreak,
              lastEntryDate: todayStr,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
      return newStreak;
    } catch (err) {
      console.warn("Could not update streak:", err);
      return userProfile?.currentStreak || 1;
    }
  };

  const updateThemePreference = async (theme: "light" | "dark" | "system") => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        themePreference: theme,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, themePreference: theme } : null));
    } catch (error) {
      console.warn("Could not save theme preference:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signOut,
        updateStreakOnNewEntry,
        updateThemePreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
