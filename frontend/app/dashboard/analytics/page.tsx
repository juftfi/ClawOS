'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Brain, Shield, Database, Zap, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { useAccount } from 'wagmi';

interface MetricCard {
    label: string;
    value: string;
    change: string;
    icon: typeof Brain;
    tone: 'emerald' | 'blue' | 'purple' | 'cyan';
}

const toneStyles = {
    emerald: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        ring: 'border-emerald-500/20',
    },
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-300',
        ring: 'border-blue-500/20',
    },
    purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-300',
        ring: 'border-purple-500/20',
    },
    cyan: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-300',
        ring: 'border-cyan-500/20',
    },
};

export default function AnalyticsPage() {
    const { address } = useAccount();
    const [loading, setLoading] = useState(true);
    const [txCount, setTxCount] = useState(0);
    const [totalVolume, setTotalVolume] = useState('0.00');
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted) return;

        const fetchAnalytics = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/quack/payment/history`);
                const history = res.data.history || [];

                setTxCount(history.length);

                const total = history.reduce((acc: number, curr: any) => {
                    let val = 0;
                    if (typeof curr.amount === 'string' && curr.amount.includes('USDC')) {
                        val = parseFloat(curr.amount.split(' ')[0]);
                    } else {
                        val = parseFloat(curr.amount) / 1000000;
                    }
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
                setTotalVolume(total.toFixed(2));
            } catch (err) {
                console.error('Analytics fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [hasMounted, address]);

    const metrics: MetricCard[] = [
        {
            label: 'Total Q402 Volume',
            value: loading ? '...' : `$${totalVolume}`,
            change: 'USDC',
            icon: TrendingUp,
            tone: 'emerald',
        },
        {
            label: 'Transactions',
            value: loading ? '...' : txCount.toString(),
            change: 'All time',
            icon: Activity,
            tone: 'blue',
        },
        {
            label: 'Active Agents',
            value: '1',
            change: 'Orchestrator',
            icon: Brain,
            tone: 'purple',
        },
        {
            label: 'Memory Entries',
            value: '--',
            change: 'Unibase',
            icon: Database,
            tone: 'cyan',
        },
    ];

    const integrationHealth = [
        { name: 'ChainGPT Hub V2', status: 'Operational', latency: '~200ms', icon: Brain, tone: 'purple' as const },
        { name: 'Q402 Protocol', status: 'Operational', latency: '~150ms', icon: Shield, tone: 'emerald' as const },
        { name: 'Unibase AIP', status: 'Operational', latency: '~300ms', icon: Database, tone: 'cyan' as const },
        { name: 'BNB Testnet RPC', status: 'Operational', latency: '~100ms', icon: Zap, tone: 'blue' as const },
    ];

    const usageBreakdown = [
        { service: 'ChainGPT Research', category: 'Intelligence', cost: '0.10 USDC', pct: 40, bar: 'from-cyan-500 to-blue-500' },
        { service: 'Agent Deployment', category: 'Execution', cost: '2.00 USDC', pct: 25, bar: 'from-emerald-500 to-teal-500' },
        { service: 'DeFi Swap', category: 'DeFi', cost: '0.50 USDC', pct: 20, bar: 'from-purple-500 to-pink-500' },
        { service: 'Contract Call', category: 'Web3', cost: '0.50 USDC', pct: 15, bar: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
                    <p className="text-slate-400 text-sm">Agent performance and usage metrics</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">Real-time</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m) => (
                    <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-lg ${toneStyles[m.tone].bg} ${toneStyles[m.tone].ring} border`}>
                                <m.icon className={`w-5 h-5 ${toneStyles[m.tone].text}`} />
                            </div>
                            <span className="text-[10px] text-white/50 font-medium uppercase tracking-[0.2em]">
                                {m.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-0.5">{m.value}</p>
                        <p className="text-xs text-slate-400">{m.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-5 h-5 text-cyan-300" />
                        <h2 className="text-lg font-semibold text-white">Service Usage</h2>
                    </div>
                    <div className="space-y-4">
                        {usageBreakdown.map((item) => (
                            <div key={item.service}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <span className="text-sm text-white font-medium">{item.service}</span>
                                        <span className="text-xs text-slate-500 ml-2">{item.category}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">{item.cost}</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${item.bar} rounded-full transition-all duration-500`}
                                        style={{ width: `${item.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-5 h-5 text-emerald-300" />
                        <h2 className="text-lg font-semibold text-white">Integration Health</h2>
                    </div>
                    <div className="space-y-4">
                        {integrationHealth.map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${toneStyles[item.tone].bg} ${toneStyles[item.tone].ring} border`}>
                                        <item.icon className={`w-4 h-4 ${toneStyles[item.tone].text}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.name}</p>
                                        <p className="text-[10px] text-slate-500">Avg latency: {item.latency}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-xs text-emerald-300 font-medium">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Network Configuration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-xs text-slate-500 mb-1">Chain</p>
                        <p className="text-sm font-semibold text-white">BNB Smart Chain Testnet</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">Chain ID: 97</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-xs text-slate-500 mb-1">RPC Endpoint</p>
                        <p className="text-sm font-semibold text-white truncate">bsc-testnet-rpc.publicnode.com</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">HTTPS</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-xs text-slate-500 mb-1">Memory Hub</p>
                        <p className="text-sm font-semibold text-white">testnet.hub.membase.io</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">Unibase AIP 2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
