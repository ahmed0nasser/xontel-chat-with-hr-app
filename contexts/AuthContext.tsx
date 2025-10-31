import React, { createContext, useState, useEffect, useContext } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { auth } from "@/config/firebase";
import { User } from "@/types";
import { getUserById } from "@/services/firebase";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CREDENTIALS_KEY = "user_credentials";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userData = await getUserById(fbUser.uid);
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        if (credentials) {
          const { username, password } = JSON.parse(credentials);
          await signIn(username, password);
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!firebaseUser) {
      tryAutoLogin();
    }
  }, [firebaseUser]);

  const signIn = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const email = `${username}@chatapp.com`;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userData = await getUserById(userCredential.user.uid);
      setUser(userData);

      await SecureStore.setItemAsync(
        CREDENTIALS_KEY,
        JSON.stringify({ username, password })
      );

      return { success: true };
    } catch (error: any) {
      console.error("Sign in error:", error);

      let errorMessage = "An error occurred during sign in";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid username or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection";
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
