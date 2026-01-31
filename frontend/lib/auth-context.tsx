'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth, UserProfile, userProfile, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await userProfile.getProfile(userId);
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        // Get current session
        const { session: currentSession } = await auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch user profile
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);

          // Create profile if it doesn't exist
          if (!profileData) {
            const { data: newProfile } = await userProfile.createProfile(
              currentSession.user.id,
              currentSession.user.email || null
            );
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);

          // Create profile if it doesn't exist
          if (!profileData) {
            const { data: newProfile } = await userProfile.createProfile(
              currentSession.user.id,
              currentSession.user.email || null
            );
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signInWithEmail(email, password);
    return { error };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    const { error } = await auth.signUpWithEmail(email, password);
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
