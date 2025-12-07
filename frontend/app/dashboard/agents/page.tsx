'use client';

import { useEffect, useState } from 'react';
import { Plus, Bot, ExternalLink, MessageSquare, Wallet, Globe, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useAccount } from 'wagmi';

interface Agent {
    id: string;
    name: string;
    description: string;
    identityAddress?: string; // ERC-8004 address
    walletAddress?: string;
    reputation: number;
}

export default function AgentsPage() {
    const { address, isConnected } = useAccount();
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
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/awe/agents`);

            if (response.data && response.data.agents) {
                // Filter agents by wallet owner if needed
                setAgents(response.data.agents);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async () => {
        if (!formData.name.trim() || !address) return;

        setCreating(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            const response = await axios.post(`${API_URL}/api/awe/create-agent`, {
                name: formData.name,
                description: formData.description || `AI agent owned by ${address}`,
                owner: address
            });

            if (response.data.success) {
                // Refresh agents list
                await fetchAgents();
                // Reset form and close modal
                setFormData({ name: '', description: '' });
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Error creating agent:', error);
            alert('Failed to create agent. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Agents</h1>
                    <p className="text-slate-400">Manage your autonomous agents participating in the AWE Network.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Agent</span>
                </button>
            </div>

            {/* Create Agent Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Research Agent Alpha"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your agent's purpose..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateAgent}
                                    disabled={!formData.name.trim() || creating}
                                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Agent'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Agents Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Agents Found</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        You haven't deployed any agents to the AWE Network yet. Create your first agent to get started.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg transition-all"
                    >
                        Deploy on Base Sepolia
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                                        <Bot className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs text-emerald-400 font-medium">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {agent.description || "An autonomous agent capable of Web3 research and execution."}
                            </p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Wallet className="w-4 h-4" /> Wallet
                                    </span>
                                    <span className="text-slate-300 font-mono text-xs">
                                        {agent.walletAddress
                                            ? `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}`
                                            : 'Pending...'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Network
                                    </span>
                                    <span className="text-purple-400 text-xs font-semibold">Base Sepolia</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 text-sm font-medium">
                                <Link
                                    href={`/dashboard/chat?agentId=${agent.id}`}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                </Link>
                                <a
                                    href={`https://sepolia.basescan.org/address/${agent.identityAddress}`}
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
