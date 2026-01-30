import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Database types
export interface UserProfile {
  id: string;
  email: string | null;
  wallet_address: string | null;
  linked_socials: {
    google?: string;
    twitter?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// Auth helper functions
export const auth = {
  // Sign up with email and password
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign in with Twitter
  async signInWithTwitter() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },
};

// User profile functions
export const userProfile = {
  // Get user profile
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Create user profile
  async createProfile(userId: string, email: string | null): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        wallet_address: null,
        linked_socials: null,
      })
      .select()
      .single();
    return { data, error };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Link wallet address
  async linkWallet(userId: string, walletAddress: string) {
    return this.updateProfile(userId, { wallet_address: walletAddress });
  },

  // Unlink wallet address
  async unlinkWallet(userId: string) {
    return this.updateProfile(userId, { wallet_address: null });
  },

  // Link social account
  async linkSocial(userId: string, provider: 'google' | 'twitter', accountId: string) {
    const { data: profile } = await this.getProfile(userId);
    const linkedSocials = profile?.linked_socials || {};
    linkedSocials[provider] = accountId;
    return this.updateProfile(userId, { linked_socials: linkedSocials });
  },

  // Unlink social account
  async unlinkSocial(userId: string, provider: 'google' | 'twitter') {
    const { data: profile } = await this.getProfile(userId);
    const linkedSocials = profile?.linked_socials || {};
    delete linkedSocials[provider];
    return this.updateProfile(userId, { linked_socials: linkedSocials });
  },
};
