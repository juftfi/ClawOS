'use client';

import Link from 'next/link';
import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Hls from 'hls.js';
import {
    ArrowUpRight,
    ShieldCheck,
    Sparkles,
    Layers,
    Cpu,
    Zap,
    ChevronRight,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

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

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Home() {
    return (
        <div className="relative min-h-screen bg-black text-white">
            <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-sm font-medium tracking-tight text-white">
                            AgentOS
                        </Link>
                        <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/70 md:flex">
                            <Link
                                href="#features"
                                className="group relative rounded-full bg-gradient-to-r from-white/40 via-white/10 to-transparent p-px"
                            >
                                <span className="block rounded-full bg-black px-4 py-2 text-white/90 transition">
                                    Features
                                </span>
                            </Link>
                            <Link href="#insights" className="transition hover:text-white">
                                Insights
                            </Link>
                            <Link href="#about" className="transition hover:text-white">
                                About
                            </Link>
                            <span className="text-white/30 line-through">Case Studies</span>
                            <Link href="#contact" className="transition hover:text-white">
                                Contact
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/auth/login?redirect=/dashboard"
                            onClick={() => trackEvent('cta_nav_get_started')}
                            className="hidden rounded-full bg-gradient-to-r from-white to-zinc-200 px-4 py-2 text-xs font-semibold text-black transition hover:from-zinc-100 hover:to-white md:inline-flex"
                        >
                            Get Started for Free
                        </Link>
                        <Link
                            href="/auth/login?redirect=/dashboard"
                            onClick={() => trackEvent('cta_nav_launch_app')}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 transition hover:text-white md:hidden"
                        >
                            Launch App
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative pt-24">
                <section className="relative overflow-hidden pb-16 pt-10">
                    <div className="pointer-events-none absolute inset-x-0 bottom-[35vh] z-0 h-[80vh]">
                        <VideoPlayer />
                    </div>

                    <motion.div
                        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 text-center"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
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
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            className="mt-10 max-w-4xl font-display text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-[80px]"
                        >
                            Where Innovation Meets Execution
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg"
                        >
                            Test autonomous agent logic in minutes. Deploy on BNB Testnet, orchestrate ChainGPT
                            intelligence, and persist memory on Unibase with verifiable speed.
                        </motion.p>

                        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link
                                href="/auth/login?redirect=/dashboard"
                                onClick={() => trackEvent('cta_hero_launch_app')}
                                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-black px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black"
                            >
                                Get Started for Free
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="#contact"
                                onClick={() => trackEvent('cta_hero_connect')}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white"
                            >
                                Let&apos;s Get Connected
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        <motion.div variants={fadeUp} className="mt-16 w-full">
                            <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-white/40">
                                {['Nova', 'Atlas', 'Helix', 'Arc', 'Sage', 'Vertex'].map((name) => (
                                    <div
                                        key={name}
                                        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/40"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                                            <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" opacity="0.4" />
                                        </svg>
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                <section className="border-t border-white/5 bg-black py-16">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Trust Signals</p>
                                <h2 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">
                                    Built with the best in AI, payments, and memory
                                </h2>
                            </div>
                            <div className="text-sm text-white/60">
                                Production-grade integrations are live on BNB Testnet and ready for demo.
                            </div>
                        </div>

                        <div className="mt-10 grid gap-6 md:grid-cols-4">
                            {['ChainGPT', 'Unibase', 'Quack Q402', 'BNB Chain'].map((name) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-sm font-semibold uppercase tracking-[0.2em] text-white/60"
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="features" className="border-t border-white/5 bg-black py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/40">How It Works</p>
                                <h2 className="mt-4 font-display text-4xl font-semibold text-white md:text-5xl">
                                    Three steps to autonomous execution
                                </h2>
                            </div>
                            <span className="text-sm text-white/60">From research to deployment in under a minute.</span>
                        </div>

                        <div className="mt-12 grid gap-6 md:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Authenticate intent',
                                    description: 'Securely authorize the agent workflow and bind identity to every request.',
                                    icon: ShieldCheck,
                                },
                                {
                                    step: '02',
                                    title: 'Orchestrate the stack',
                                    description: 'ChainGPT intelligence coordinates research, audits, and contract generation.',
                                    icon: Cpu,
                                },
                                {
                                    step: '03',
                                    title: 'Execute + remember',
                                    description: 'Q402 payments finalize execution while Unibase records immutable memory.',
                                    icon: Zap,
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white/50">{item.step}</span>
                                        <item.icon className="h-5 w-5 text-white/70" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="insights" className="border-t border-white/5 bg-black py-20">
                    <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Insights</p>
                            <h2 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">
                                Live telemetry for every agent workflow
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-slate-300">
                                Monitor workflow latency, contract audits, and payment verification across every agent
                                run. Alerts surface risk before execution, so teams stay in control.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
                                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                    Risk-aware execution
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                    Audit visibility
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                    Memory integrity
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8">
                            {[
                                { label: 'Avg. workflow latency', value: '1.9s' },
                                { label: 'Audit success rate', value: '98.4%' },
                                { label: 'Memory sync status', value: 'Live' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                                        {item.label}
                                    </span>
                                    <span className="text-xl font-semibold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="about" className="border-t border-white/5 bg-black py-20">
                    <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[0.9fr_1.1fr]">
                        <div className="flex flex-col justify-center">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Meet the Agent</p>
                            <h2 className="mt-4 font-display text-4xl font-semibold text-white">
                                Your autonomous partner for Web3 execution
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-slate-300">
                                AgentOS unifies identity, payments, and memory into a single operating layer. Every
                                action is verifiable, composable, and ready for production-grade deployments.
                            </p>
                            <div className="mt-6 space-y-3 text-sm text-white/80">
                                {[
                                    'AI research + contract generation in one workflow',
                                    'Q402 delegated payments with policy controls',
                                    'Persistent memory captured via Unibase AIP',
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                                            <Sparkles className="h-3.5 w-3.5 text-white/80" />
                                        </span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Agent Snapshot</p>
                                    <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                                        Prime Orchestrator
                                    </h3>
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                                    Live
                                </span>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {[
                                    { label: 'Network', value: 'BNB Testnet' },
                                    { label: 'Identity', value: 'ERC-8004' },
                                    { label: 'Memory', value: 'Unibase Hub' },
                                    { label: 'Payments', value: 'Q402' },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-white/10 bg-black/60 p-4"
                                    >
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                            {item.label}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/70">
                                <span>Last execution</span>
                                <span className="text-white">2 minutes ago</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer id="contact" className="border-t border-white/5 bg-black py-12">
                <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
                    <div>
                        <h3 className="font-display text-2xl font-semibold text-white">AgentOS</h3>
                        <p className="mt-2 text-sm text-white/60">
                            The operating system for autonomous agents.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.3em] text-white/50">
                        <a
                            href="https://github.com/RicheySon/AgentOS-web3"
                            className="transition hover:text-white"
                        >
                            Docs
                        </a>
                        <a href="https://x.com" className="transition hover:text-white">
                            X
                        </a>
                        <a href="https://t.me" className="transition hover:text-white">
                            Telegram
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
