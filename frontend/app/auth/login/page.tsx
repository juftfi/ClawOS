'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/supabase';
import { signInWithWallet } from '@/lib/siwe';
import { Mail, Lock, Wallet, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet' | 'social'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Failed to sign in');
        return;
      }

      setSuccess('Successfully signed in!');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet login
  const handleWalletLogin = async () => {
    if (!address || !chainId) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signInWithWallet(address, chainId, async (message) => {
        return await signMessageAsync({ message });
      });

      if (!result.success) {
        setError(result.message || 'Wallet authentication failed');
        return;
      }

      setSuccess('Successfully signed in with wallet!');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      const { error: socialError } = provider === 'google'
        ? await auth.signInWithGoogle()
        : await auth.signInWithTwitter();

      if (socialError) {
        setError(socialError.message || 'Social login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AgentOS</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 shadow-2xl">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-900/50 rounded-lg">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('wallet')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'wallet'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => setLoginMethod('social')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'social'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Social
            </button>
          </div>

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400">
                  <input type="checkbox" className="mr-2 rounded" />
                  Remember me
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* Wallet Login */}
          {loginMethod === 'wallet' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Sign in securely with your Ethereum wallet
                </p>
              </div>

              {!address ? (
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              ) : (
                <button
                  onClick={handleWalletLogin}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Signing in...' : 'Sign In with Wallet'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Social Login */}
          {loginMethod === 'social' && (
            <div className="space-y-4">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => handleSocialLogin('twitter')}
                disabled={loading}
                className="w-full py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Continue with X (Twitter)
              </button>
            </div>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
