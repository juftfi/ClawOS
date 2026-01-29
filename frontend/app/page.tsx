'use client';

import { ArrowRight, Sparkles, Shield, Brain, Database, Github, Twitter } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20 relative">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                <motion.div
                    className="text-center space-y-8 max-w-5xl mx-auto"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm backdrop-blur-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Powered by ChainGPT & Unibase</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white leading-tight">
                        The World's First
                        <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            Autonomous AI Agent
                        </span>
                        Platform
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        AI agents that can <span className="text-purple-400 font-semibold">think</span>, <span className="text-pink-400 font-semibold">pay</span>, and <span className="text-cyan-400 font-semibold">remember</span> forever on blockchain.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link
                            href="/dashboard"
                            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold flex items-center gap-2 justify-center transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                        >
                            Launch App
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="https://github.com/RicheySon/AgentOS-web3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 border-2 border-purple-600 text-purple-400 hover:bg-purple-600/10 rounded-lg font-semibold transition-all flex items-center gap-2 justify-center"
                        >
                            <Github className="w-5 h-5" />
                            View on GitHub
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">2</div>
                            <div className="text-slate-400 text-sm mt-1">Bounties Integrated</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">1</div>
                            <div className="text-slate-400 text-sm mt-1">Network Supported</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">100%</div>
                            <div className="text-slate-400 text-sm mt-1">Testnet Ready</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bounty Cards Section */}
            <div className="py-20 bg-slate-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Three Bounties, One Platform
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Integrating cutting-edge technologies to create the ultimate autonomous AI agent ecosystem
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">

                        {/* Quack × ChainGPT Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="group bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Quack × ChainGPT</h3>
                            <p className="text-purple-400 text-sm font-medium mb-4">AI Intelligence</p>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                AI-powered research, contract generation, and DeFi execution
                            </p>

                            <ul className="space-y-3 mb-6">
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-purple-400 mt-0.5">✓</span>
                                    <span>Smart Research & Analysis</span>
                                </li>
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-purple-400 mt-0.5">✓</span>
                                    <span>Contract Gen & Audit</span>
                                </li>
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-purple-400 mt-0.5">✓</span>
                                    <span>DeFi Action Execution</span>
                                </li>
                            </ul>

                            <div className="text-xs text-slate-500 border-t border-slate-700 pt-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                BNB Smart Chain Testnet
                            </div>
                        </motion.div>

                        {/* Unibase Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="group bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-emerald-500 transition-all hover:shadow-xl hover:shadow-emerald-500/20"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Database className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Unibase</h3>
                            <p className="text-purple-400 text-sm font-medium mb-4">Immortal Memory</p>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Persistent decentralized memory that never forgets
                            </p>

                            <ul className="space-y-3 mb-6">
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-emerald-400 mt-0.5">✓</span>
                                    <span>Persistent Storage</span>
                                </li>
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-emerald-400 mt-0.5">✓</span>
                                    <span>Cross-Platform Sync</span>
                                </li>
                                <li className="text-slate-300 flex items-start gap-2 text-sm">
                                    <span className="text-emerald-400 mt-0.5">✓</span>
                                    <span>Knowledge Sharing</span>
                                </li>
                            </ul>

                            <div className="text-xs text-slate-500 border-t border-slate-700 pt-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Membase Decentralized Hub
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Three simple steps to unleash the power of autonomous AI agents
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[
                            { num: '01', title: 'Fund Wallet', desc: 'Connect your wallet and get BNB/USDT on the BNB Testnet' },
                            { num: '02', title: 'Chat & Execute', desc: 'AI-powered research, contract generation, and DeFi actions' },
                            { num: '03', title: 'Never Forget', desc: 'Permanent memory storage in decentralized Membase' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                className="text-center"
                            >
                                <div className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-6">
                                    {item.num}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 border-t border-slate-800">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                                AgentOS-Web3
                            </h3>
                            <p className="text-slate-400 text-sm">
                                The future of autonomous AI agents on blockchain
                            </p>
                        </div>

                        <div className="flex gap-6">
                            <a
                                href="https://github.com/RicheySon/AgentOS-web3"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <Github className="w-6 h-6" />
                            </a>
                            <a
                                href="#"
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <Twitter className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                        <p>© 2025 AgentOS-Web3. Built for the future of Web3.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
