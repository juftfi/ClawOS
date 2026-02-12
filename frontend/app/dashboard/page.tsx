'use client';

import { useEffect, useState } from 'react';
import { Brain, DollarSign, MessageSquare, Activity, Database, Shield, Zap, Clock, ArrowUpRight, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface Stats {
    agents: number;
    usdcSpent: string;
    conversations: number;
    transactions: number;
}

interface ActivityItem {
    type: string;
    label: string;
    timestamp: string;
    amount?: string;
}

export default function DashboardOverview() {
    const router = useRouter();
    const { address } = useAccount();
    const [stats, setStats] = useState<Stats>({
        agents: 0,
        usdcSpent: '0.00',
        conversations: 0,
        transactions: 0
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const fetchStats = async () => {
        if (!hasMounted) return;

        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            setStats(prev => ({ ...prev, agents: 1 }));

            const historyRes = await axios.get(`${API_URL}/api/quack/payment/history`);
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

            // Build recent activity from payment history
            const activity: ActivityItem[] = history.slice(0, 5).map((h: any) => ({
                type: 'payment',
                label: h.serviceType || 'Q402 Payment',
                timestamp: h.timestamp || new Date().toISOString(),
                amount: typeof h.amount === 'string' ? h.amount : `${(parseFloat(h.amount) / 1000000).toFixed(2)} USDC`
            }));
            setRecentActivity(activity);

            setStats(prev => ({
                ...prev,
                usdcSpent: totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                transactions: history.length
            }));
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [address, hasMounted]);

    const statCards = [
        { label: 'Active Orchestrator', value: loading ? '...' : '1', icon: Brain, color: 'purple', badge: 'Online' },
        { label: 'USDC Volume', value: loading ? '...' : `$${stats.usdcSpent}`, icon: DollarSign, color: 'emerald', badge: 'BNB' },
        { label: 'Agent Queries', value: loading ? '...' : stats.conversations.toString(), icon: MessageSquare, color: 'blue', badge: null },
        { label: 'Q402 Transactions', value: loading ? '...' : stats.transactions.toString(), icon: Activity, color: 'yellow', badge: null },
    ];

    const integrations = [
        {
            title: 'Quack × ChainGPT',
            subtitle: 'Web3 LLM Intelligence',
            icon: Brain,
            status: 'Connected',
            network: 'BNB Testnet',
            color: 'purple',
            features: ['Research', 'Audit', 'Deploy'],
            action: () => router.push('/dashboard/chat')
        },
        {
            title: 'Q402 Protocol',
            subtitle: 'EIP-7702 Payments',
            icon: Shield,
            status: 'Active',
            network: 'BNB Testnet',
            color: 'yellow',
            features: ['Sign-to-pay', 'Spend caps', 'USDC'],
            action: () => router.push('/dashboard/actions')
        },
        {
            title: 'Unibase Memory',
            subtitle: 'AIP 2.0 Persistence',
            icon: Database,
            status: 'Synced',
            network: 'Membase Hub',
            color: 'emerald',
            features: ['ZK-proof', 'Immortal', 'Cross-session'],
            action: () => router.push('/dashboard/memory')
        },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Overview</h1>
                    <p className="text-slate-500 text-sm">Real-time agent metrics on BNB Testnet</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">All Systems Live</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-lg bg-${stat.color}-500/10`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                            </div>
                            {stat.badge && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400 border border-${stat.color}-500/20`}>
                                    {stat.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Integration Cards + Activity Feed */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Integrations */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Active Integrations</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {integrations.map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg bg-${item.color}-500/10`}>
                                        <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                                    </div>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                        {item.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
                                <p className="text-[11px] text-slate-500 mb-3">{item.subtitle}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.features.map((f, j) => (
                                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-600">
                                    <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500`} />
                                    {item.network}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No activity yet</p>
                                <p className="text-xs text-slate-600 mt-1">Execute an action to see history</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{item.label}</p>
                                                <p className="text-[10px] text-slate-600">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        {item.amount && (
                                            <span className="text-xs font-mono text-emerald-400">{item.amount}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'AI Chat', desc: 'Research with ChainGPT', href: '/dashboard/chat', icon: MessageSquare, color: 'purple' },
                        { label: 'Agent Actions', desc: 'Execute on-chain tasks', href: '/dashboard/actions', icon: Zap, color: 'yellow' },
                        { label: 'Smart Contracts', desc: 'Generate, audit, deploy', href: '/dashboard/contracts', icon: Shield, color: 'blue' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => router.push(item.href)}
                            className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all text-left group"
                        >
                            <div className={`p-2.5 rounded-lg bg-${item.color}-500/10 group-hover:bg-${item.color}-500/20 transition-colors`}>
                                <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
