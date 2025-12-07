'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, MessageSquare, Activity, TrendingUp, Shield, Brain, Database } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Stats {
    agents: number;
    usdcSpent: string;
    conversations: number;
    transactions: number;
}

export default function DashboardOverview() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        agents: 0,
        usdcSpent: '0.00',
        conversations: 0,
        transactions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch stats from backend
        const fetchStats = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

                // Fetch agents
                const agentsRes = await axios.get(`${API_URL}/api/awe/agents`);
                const agentCount = agentsRes.data.agents?.length || 0;

                // Fetch payments for stats
                const historyRes = await axios.get(`${API_URL}/api/awe/payment/history`);
                const history = historyRes.data.history || [];

                const totalSpent = history.reduce((acc: number, curr: any) => {
                    let val = 0;
                    if (typeof curr.amount === 'string' && curr.amount.includes('USDC')) {
                        val = parseFloat(curr.amount.split(' ')[0]);
                    } else {
                        val = parseFloat(curr.amount) / 1000000;
                    }
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);

                setStats({
                    agents: agentCount,
                    usdcSpent: totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    conversations: 0, // No conversations index yet
                    transactions: history.length
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            label: 'Total Agents',
            value: loading ? '...' : stats.agents.toString(),
            icon: Users,
            change: '+0%',
            changeType: 'positive' as const,
            color: 'purple'
        },
        {
            label: 'USDC Spent',
            value: loading ? '...' : `$${stats.usdcSpent}`,
            icon: DollarSign,
            change: '+0%',
            changeType: 'positive' as const,
            color: 'emerald'
        },
        {
            label: 'Conversations',
            value: loading ? '...' : stats.conversations.toString(),
            icon: MessageSquare,
            change: '+0%',
            changeType: 'positive' as const,
            color: 'blue'
        },
        {
            label: 'Transactions',
            value: loading ? '...' : stats.transactions.toString(),
            icon: Activity,
            change: '+0%',
            changeType: 'positive' as const,
            color: 'pink'
        },
    ];

    const bountyCards = [
        {
            title: 'AWE Network',
            subtitle: 'Identity & Payments',
            icon: Shield,
            status: 'Active',
            network: 'Base Sepolia',
            color: 'blue'
        },
        {
            title: 'Quack × ChainGPT',
            subtitle: 'AI Intelligence',
            icon: Brain,
            status: 'Active',
            network: 'BNB Testnet',
            color: 'purple'
        },
        {
            title: 'Unibase',
            subtitle: 'Immortal Memory',
            icon: Database,
            status: 'Active',
            network: 'Membase Hub',
            color: 'emerald'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                <p className="text-slate-400">Welcome back! Here's what's happening with your AI agents.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                            </div>
                            <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-sm text-slate-400">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bounty Status */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Bounty Integration Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {bountyCards.map((bounty, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-${bounty.color}-500/10`}>
                                    <bounty.icon className={`w-6 h-6 text-${bounty.color}-400`} />
                                </div>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
                                    {bounty.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{bounty.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{bounty.subtitle}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <div className={`w-2 h-2 rounded-full bg-${bounty.color}-500`}></div>
                                {bounty.network}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                        onClick={() => router.push('/dashboard/agents')}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-600 hover:bg-slate-800 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                <Users className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Create Agent</h3>
                                <p className="text-sm text-slate-400">Deploy new AI agent</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/chat')}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600 hover:bg-slate-800 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Start Chat</h3>
                                <p className="text-sm text-slate-400">Talk to AI agent</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/analytics')}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-600 hover:bg-slate-800 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">View Analytics</h3>
                                <p className="text-sm text-slate-400">Check performance</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
