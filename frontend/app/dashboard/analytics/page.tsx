'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Brain, Shield, Database, Zap, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { useAccount } from 'wagmi';

interface MetricCard {
    label: string;
    value: string;
    change: string;
    icon: any;
    color: string;
}

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
        { label: 'Total Q402 Volume', value: loading ? '...' : `$${totalVolume}`, change: 'USDC', icon: TrendingUp, color: 'emerald' },
        { label: 'Transactions', value: loading ? '...' : txCount.toString(), change: 'All time', icon: Activity, color: 'blue' },
        { label: 'Active Agents', value: '1', change: 'Orchestrator', icon: Brain, color: 'purple' },
        { label: 'Memory Entries', value: '--', change: 'Unibase', icon: Database, color: 'emerald' },
    ];

    const integrationHealth = [
        { name: 'ChainGPT Hub V2', status: 'Operational', latency: '~200ms', icon: Brain, color: 'purple' },
        { name: 'Q402 Protocol', status: 'Operational', latency: '~150ms', icon: Shield, color: 'yellow' },
        { name: 'Unibase AIP', status: 'Operational', latency: '~300ms', icon: Database, color: 'emerald' },
        { name: 'BNB Testnet RPC', status: 'Operational', latency: '~100ms', icon: Zap, color: 'blue' },
    ];

    const usageBreakdown = [
        { service: 'ChainGPT Research', category: 'Intelligence', cost: '0.10 USDC', pct: 40 },
        { service: 'Agent Deployment', category: 'Execution', cost: '2.00 USDC', pct: 25 },
        { service: 'DeFi Swap', category: 'DeFi', cost: '0.50 USDC', pct: 20 },
        { service: 'Contract Call', category: 'Web3', cost: '0.50 USDC', pct: 15 },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
                    <p className="text-slate-500 text-sm">Agent performance and usage metrics</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">Real-time</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-lg bg-${m.color}-500/10`}>
                                <m.icon className={`w-5 h-5 text-${m.color}-400`} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{m.change}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-0.5">{m.value}</p>
                        <p className="text-xs text-slate-500">{m.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Service Usage Breakdown */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Service Usage</h2>
                    </div>
                    <div className="space-y-4">
                        {usageBreakdown.map((item, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <span className="text-sm text-white font-medium">{item.service}</span>
                                        <span className="text-xs text-slate-600 ml-2">{item.category}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">{item.cost}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${item.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Health */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">Integration Health</h2>
                    </div>
                    <div className="space-y-4">
                        {integrationHealth.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${item.color}-500/10`}>
                                        <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.name}</p>
                                        <p className="text-[10px] text-slate-600">Avg latency: {item.latency}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-xs text-emerald-400 font-medium">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Network Info */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Network Configuration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Chain</p>
                        <p className="text-sm font-semibold text-white">BNB Smart Chain Testnet</p>
                        <p className="text-xs text-slate-600 font-mono mt-1">Chain ID: 97</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">RPC Endpoint</p>
                        <p className="text-sm font-semibold text-white truncate">data-seed-prebsc-1-s1.binance.org</p>
                        <p className="text-xs text-slate-600 font-mono mt-1">HTTPS</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Memory Hub</p>
                        <p className="text-sm font-semibold text-white">testnet.hub.membase.io</p>
                        <p className="text-xs text-slate-600 font-mono mt-1">Unibase AIP 2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
