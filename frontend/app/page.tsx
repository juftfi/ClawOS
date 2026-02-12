'use client';

import { useState } from 'react';
import { ArrowRight, Brain, Shield, Database, Github, Zap, Globe, MessageSquare, Terminal, Menu, X, Cpu, Layers, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const fade = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">
            {/* --- NAV --- */}
            <nav className="fixed top-0 w-full z-50 glass-strong safe-top">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold tracking-tight">AgentOS</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#how" className="text-sm text-slate-400 hover:text-neon-cyan transition-colors">How it Works</a>
                        <a href="#features" className="text-sm text-slate-400 hover:text-neon-cyan transition-colors">Features</a>
                        <a href="#stack" className="text-sm text-slate-400 hover:text-neon-cyan transition-colors">Stack</a>
                        <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all">
                            Launch App
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-400">
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-white/5 bg-surface-950/95 backdrop-blur-xl"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <a href="#how" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-slate-300">How it Works</a>
                                <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-slate-300">Features</a>
                                <a href="#stack" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-slate-300">Stack</a>
                                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-3 text-center text-sm font-semibold rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                    Launch App
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* --- HERO --- */}
            <section className="relative min-h-[100dvh] flex items-center justify-center px-4 pt-14">
                {/* Background layers */}
                <div className="absolute inset-0 cyber-grid" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-neon-purple/6 rounded-full blur-[80px]" />
                <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-neon-pink/5 rounded-full blur-[60px]" />

                <motion.div
                    className="relative max-w-3xl mx-auto text-center"
                    initial="hidden"
                    animate="visible"
                >
                    {/* Status badge */}
                    <motion.div variants={fade} custom={0} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-green/20 bg-neon-green/5 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                        <span className="text-xs font-medium text-neon-green">Live on BNB Testnet</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={fade} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-5">
                        AI Agents That
                        <br />
                        <span className="text-gradient">Think. Pay. Remember.</span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p variants={fade} custom={2} className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
                        Autonomous agents powered by ChainGPT intelligence, Q402 payments, and Unibase immortal memory — all on-chain.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={fade} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
                        <Link
                            href="/dashboard"
                            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon-cyan transition-all hover:shadow-neon-purple"
                        >
                            Open Dashboard
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <a
                            href="https://github.com/RicheySon/AgentOS-web3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass text-slate-300 font-semibold hover:text-white transition-all"
                        >
                            <Github className="w-4 h-4" />
                            Source Code
                        </a>
                    </motion.div>

                    {/* Metrics strip */}
                    <motion.div variants={fade} custom={4} className="inline-flex items-center gap-4 sm:gap-8 px-5 py-3 rounded-2xl glass">
                        {[
                            { val: '213', label: 'Tests' },
                            { val: '3', label: 'APIs' },
                            { val: '97', label: 'Chain ID' },
                            { val: 'Live', label: 'Status', accent: true },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className={`text-lg sm:text-xl font-bold font-mono ${s.accent ? 'text-neon-green' : 'text-white'}`}>{s.val}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    <div className="w-5 h-8 rounded-full border border-white/10 flex justify-center pt-1.5">
                        <div className="w-1 h-2 rounded-full bg-neon-cyan/60 animate-bounce" />
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section id="how" className="py-20 sm:py-28 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <p className="text-xs font-semibold text-neon-cyan uppercase tracking-[0.2em] mb-3">How It Works</p>
                        <h2 className="text-3xl sm:text-4xl font-bold">Four Steps to Autonomy</h2>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { n: '01', title: 'Connect', desc: 'Link your wallet on BNB Testnet', icon: Globe, color: 'neon-cyan' },
                            { n: '02', title: 'Instruct', desc: 'Chat with ChainGPT to plan actions', icon: MessageSquare, color: 'neon-purple' },
                            { n: '03', title: 'Execute', desc: 'Agent pays via Q402 and acts', icon: Zap, color: 'neon-pink' },
                            { n: '04', title: 'Remember', desc: 'Stored forever in Unibase', icon: Database, color: 'neon-green' },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass rounded-2xl p-5 sm:p-6 text-center group hover:neon-border transition-all"
                            >
                                <div className="text-[10px] font-mono text-slate-600 mb-3">{step.n}</div>
                                <div className={`w-10 h-10 rounded-xl bg-${step.color}/10 flex items-center justify-center mx-auto mb-3`}>
                                    <step.icon className={`w-5 h-5 text-${step.color}`} />
                                </div>
                                <h3 className="text-sm font-bold mb-1">{step.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FEATURES / THREE PILLARS --- */}
            <section id="features" className="py-20 sm:py-28 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/[0.02] to-transparent" />
                <div className="max-w-5xl mx-auto relative">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <p className="text-xs font-semibold text-neon-purple uppercase tracking-[0.2em] mb-3">Core Stack</p>
                        <h2 className="text-3xl sm:text-4xl font-bold">Three Pillars of Autonomy</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* ChainGPT */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="glass rounded-2xl p-6 sm:p-8 group hover:shadow-neon-purple transition-all"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-neon-purple" />
                                </div>
                                <div>
                                    <h3 className="font-bold">ChainGPT</h3>
                                    <p className="text-[10px] text-neon-purple font-medium uppercase tracking-wider">Hub V2 Intelligence</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mb-5">
                                Web3-native LLM for research, contract generation, security auditing, and autonomous DeFi execution.
                            </p>
                            <div className="space-y-2">
                                {['Token & protocol research', 'Smart contract gen + audit', 'Market narrative analysis', 'DeFi action orchestration'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                        <div className="w-1 h-1 rounded-full bg-neon-purple" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Q402 */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="glass rounded-2xl p-6 sm:p-8 group hover:shadow-neon-cyan transition-all"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-neon-cyan" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Q402 Payments</h3>
                                    <p className="text-[10px] text-neon-cyan font-medium uppercase tracking-wider">EIP-7702 Delegated</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mb-5">
                                Sign-to-pay protocol enabling agents to autonomously handle USDC transactions with human-set spend caps.
                            </p>
                            <div className="space-y-2">
                                {['Delegated USDC transfers', 'Configurable spend limits', 'Per-service pricing tiers', 'On-chain tx verification'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                        <div className="w-1 h-1 rounded-full bg-neon-cyan" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Unibase */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="glass rounded-2xl p-6 sm:p-8 group hover:shadow-neon-green transition-all"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-xl bg-neon-green/10 flex items-center justify-center">
                                    <Database className="w-5 h-5 text-neon-green" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Unibase Memory</h3>
                                    <p className="text-[10px] text-neon-green font-medium uppercase tracking-wider">AIP 2.0 Protocol</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mb-5">
                                Decentralized persistent memory with ZK-proof verification. Your agents never forget, across sessions and chains.
                            </p>
                            <div className="space-y-2">
                                {['Immortal agent memory', 'ZK-SNARK proof metadata', 'Cross-session context', 'Membase hub sync'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                        <div className="w-1 h-1 rounded-full bg-neon-green" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- TECH STACK --- */}
            <section id="stack" className="py-20 sm:py-28 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <p className="text-xs font-semibold text-neon-cyan uppercase tracking-[0.2em] mb-3">Tech Stack</p>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Production-Grade Infrastructure</h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">Every integration is live and verified on testnet.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
                        {[
                            { name: 'Next.js 15', sub: 'App Router + RSC', icon: Layers },
                            { name: 'Express.js 5', sub: 'REST API', icon: Cpu },
                            { name: 'ChainGPT', sub: 'Hub V2 LLM', icon: Brain },
                            { name: 'Unibase', sub: 'AIP 2.0 Memory', icon: Database },
                            { name: 'Wagmi + Viem', sub: 'Web3 Primitives', icon: Globe },
                            { name: 'RainbowKit', sub: 'Wallet Connect', icon: Lock },
                            { name: 'BNB Chain', sub: 'Testnet (97)', icon: Zap },
                            { name: 'Hardhat', sub: 'Contracts', icon: Shield },
                        ].map((t, i) => (
                            <div key={i} className="glass rounded-xl p-4 flex items-center gap-3 hover:shadow-glass transition-all">
                                <t.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">{t.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{t.sub}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-20 sm:py-28 px-4">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass neon-border rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/[0.03] via-transparent to-neon-purple/[0.03]" />
                        <div className="relative">
                            <Sparkles className="w-7 h-7 text-neon-cyan mx-auto mb-5" />
                            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                                Ready to Build Autonomous Agents?
                            </h2>
                            <p className="text-sm text-slate-400 mb-7 max-w-sm mx-auto">
                                Connect your wallet and deploy AI agents that think, pay, and remember on-chain.
                            </p>
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon-cyan hover:shadow-neon-purple transition-all"
                            >
                                Launch Dashboard
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-6 px-4 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                            <Terminal className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold">AgentOS</span>
                    </div>
                    <p className="text-[10px] text-slate-600">&copy; 2026 AgentOS. Autonomous AI on blockchain.</p>
                    <a href="https://github.com/RicheySon/AgentOS-web3" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-neon-cyan transition-colors">
                        <Github className="w-4 h-4" />
                    </a>
                </div>
            </footer>
        </div>
    );
}
