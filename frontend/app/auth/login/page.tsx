'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/lib/auth-context';
import { auth, isSupabaseConfigured } from '@/lib/supabase';
import { signInWithWallet } from '@/lib/siwe';
import Hls from 'hls.js';
import { Mail, Lock, Wallet, ArrowRight, AlertCircle, Sparkles, ShieldCheck, Layers } from 'lucide-react';

const VIDEO_SRC = 'https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8';

const VideoPlayer = memo(function VideoPlayer() {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = VIDEO_SRC;
            return;
        }

        if (!Hls.isSupported()) return;

        const hls = new Hls({ enableWorker: true });
        hls.loadSource(VIDEO_SRC);
        hls.attachMedia(video);

        return () => {
            hls.destroy();
        };
    }, []);

    return (
        <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
        />
    );
});

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
    const supabaseReady = isSupabaseConfigured();

    useEffect(() => {
        if (!supabaseReady && loginMethod !== 'wallet') {
            setLoginMethod('wallet');
        }
        if (!supabaseReady) {
            setError(null);
            setSuccess(null);
        }
    }, [loginMethod, supabaseReady]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseReady) {
            setError(null);
            return;
        }
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

    const handleSocialLogin = async (provider: 'google' | 'twitter') => {
        if (!supabaseReady) {
            setError(null);
            return;
        }
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
        <div className="relative min-h-screen bg-black text-white">
            <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-sm font-medium tracking-tight text-white">
                            AgentOS
                        </Link>
                        <div className="hidden items-center gap-4 text-xs uppercase tracking-[0.2em] text-white/70 md:flex">
                            <Link href="/#features" className="transition hover:text-white">
                                Features
                            </Link>
                            <Link href="/#insights" className="transition hover:text-white">
                                Insights
                            </Link>
                            <Link href="/#about" className="transition hover:text-white">
                                About
                            </Link>
                        </div>
                    </div>
                    <Link
                        href="/auth/signup"
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
                    >
                        Create Account
                    </Link>
                </div>
            </nav>

            <main className="relative pt-24">
                <section className="relative overflow-hidden pb-16 pt-10">
                    <div className="pointer-events-none absolute inset-x-0 bottom-[35vh] z-0 h-[80vh]">
                        <VideoPlayer />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {[
                                { label: 'Integrated with ChainGPT', icon: Sparkles },
                                { label: 'Integrated with Unibase', icon: Layers },
                                { label: 'Integrated with Quack Q402', icon: ShieldCheck },
                            ].map((badge) => (
                                <span
                                    key={badge.label}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur"
                                >
                                    <badge.icon className="h-4 w-4 text-white/80" />
                                    {badge.label}
                                </span>
                            ))}
                        </div>

                        <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                            Sign in to AgentOS
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                            Authenticate to orchestrate autonomous agents, execute payments, and track verifiable memory.
                        </p>

                        <div className="mt-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur">
                            {error && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-lg flex items-center gap-2 text-rose-200">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {!supabaseReady && (
                                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm">
                                    Email and social sign-in are disabled until Supabase environment variables are configured.
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-emerald-200 text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="flex gap-2 mb-6 p-1 bg-black/60 rounded-lg">
                                <button
                                    onClick={() => supabaseReady && setLoginMethod('email')}
                                    disabled={!supabaseReady}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                        loginMethod === 'email'
                                            ? 'bg-white text-black'
                                            : 'text-white/50 hover:text-white'
                                    } ${!supabaseReady ? 'cursor-not-allowed opacity-40' : ''}`}
                                >
                                    Email
                                </button>
                                <button
                                    onClick={() => setLoginMethod('wallet')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                        loginMethod === 'wallet'
                                            ? 'bg-white text-black'
                                            : 'text-white/50 hover:text-white'
                                    }`}
                                >
                                    Wallet
                                </button>
                                <button
                                    onClick={() => supabaseReady && setLoginMethod('social')}
                                    disabled={!supabaseReady}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                        loginMethod === 'social'
                                            ? 'bg-white text-black'
                                            : 'text-white/50 hover:text-white'
                                    } ${!supabaseReady ? 'cursor-not-allowed opacity-40' : ''}`}
                                >
                                    Social
                                </button>
                            </div>

                            {loginMethod === 'email' && supabaseReady && (
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-[0.2em]">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-[0.2em]">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                                placeholder="********"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center text-white/50">
                                            <input type="checkbox" className="mr-2 rounded border-white/20 bg-black/40" />
                                            Remember me
                                        </label>
                                        <Link href="/auth/reset-password" className="text-white/60 hover:text-white">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                            )}

                            {loginMethod === 'wallet' && (
                                <div className="space-y-4">
                                    <div className="text-center mb-4">
                                        <Wallet className="w-12 h-12 text-white/80 mx-auto mb-3" />
                                        <p className="text-white/60 text-sm">
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
                                            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Signing in...' : 'Sign In with Wallet'}
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {loginMethod === 'social' && supabaseReady && (
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
                                        className="w-full py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Continue with X (Twitter)
                                    </button>
                                </div>
                            )}

                            <div className="mt-6 text-center text-sm text-white/60">
                                Don&apos;t have an account?{' '}
                                <Link href="/auth/signup" className="text-white hover:text-white/80 font-medium">
                                    Sign up
                                </Link>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-xs text-white/40">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
