'use client';

import { useEffect, useState } from 'react';
import { Plus, Bot, ExternalLink, MessageSquare, Wallet, Globe, X, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useAccount } from 'wagmi';

interface Agent {
    id: string;
    name: string;
    description: string;
    walletAddress?: string;
    reputation: number;
}

export default function AgentsPage() {
    const { address, isConnected, chain } = useAccount();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (isConnected && address) {
            fetchAgents();
        }
    }, [address, isConnected]);

    const fetchAgents = async () => {
        try {
            // Updated for production focus: Primary Agent Orchestrator
            setAgents([{
                id: 'primary-agent',
                name: 'ChainGPT Super Agent',
                description: 'Autonomous agent specializing in Web3 research, contract auditing, and DeFi execution on BNB Chain.',
                reputation: 98,
                walletAddress: '0x2f914bcbad5bf4967bbb11e4372200b7c7594aeb'
            }]);
        } catch (error) {
            console.error('Error fetching agents:', error);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async () => {
        alert('Custom agent creation on BNB is coming in Phase 1. Use the primary Super Agent for now.');
        setShowCreateModal(false);
    };

    const isBNBTestnet = chain?.id === 97;

    const [hasMounted, setHasMounted] = useState(false);

    // Fix hydration mismatch
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Show loading until mounted
    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Network Warning */}
            {!isBNBTestnet && isConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-300 mb-1">Wrong Network</h3>
                            <p className="text-sm text-yellow-200/80">
                                Agent operations are optimized for <strong>BNB Smart Chain Testnet</strong>.
                                Please switch networks in the top bar.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Agent Orchestrator</h1>
                    <p className="text-slate-400">Manage your autonomous agents powered by ChainGPT and BNB Chain.</p>
                </div>
            </div>

            {/* Agents Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1].map((i) => (
                        <div key={i} className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <Bot className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs text-emerald-400 font-medium">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {agent.description}
                            </p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Wallet className="w-4 h-4" /> Agent Wallet
                                    </span>
                                    <span className="text-slate-300 font-mono text-xs">
                                        {agent.walletAddress?.slice(0, 6)}...{agent.walletAddress?.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Active Network
                                    </span>
                                    <span className="text-yellow-400 text-xs font-semibold">BNB Testnet</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 text-sm font-medium">
                                <Link
                                    href={`/dashboard/chat?agentId=${agent.id}`}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Launch Interface
                                </Link>
                                <a
                                    href={`https://testnet.bscscan.com/address/${agent.walletAddress}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
