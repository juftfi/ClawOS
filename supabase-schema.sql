-- ClawOS User Profiles Table
-- This schema should be executed in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    wallet_address TEXT UNIQUE,
    linked_socials JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address
ON public.user_profiles(wallet_address);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
ON public.user_profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before any update
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, wallet_address, linked_socials)
    VALUES (
        NEW.id,
        NEW.email,
        NULL,
        '{}'::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Optional: Create a view for user profile with auth data
CREATE OR REPLACE VIEW public.user_profiles_with_auth AS
SELECT
    p.id,
    p.email,
    p.wallet_address,
    p.linked_socials,
    p.created_at,
    p.updated_at,
    u.email as auth_email,
    u.email_confirmed_at,
    u.last_sign_in_at
FROM public.user_profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile information for ClawOS';
COMMENT ON COLUMN public.user_profiles.id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address';
COMMENT ON COLUMN public.user_profiles.wallet_address IS 'Linked Ethereum wallet address';
COMMENT ON COLUMN public.user_profiles.linked_socials IS 'JSON object with linked social accounts (google, twitter)';
