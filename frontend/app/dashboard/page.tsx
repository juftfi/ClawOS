'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Cpu,
    Brain,
    Database,
    Shield,
    ArrowUpRight,
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface AgentStats {
    totalWorkflows: number;
    runningWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
}

const accentStyles = {
    cyan: {
        icon: 'text-cyan-300',
        bg: 'bg-cyan-500/10',
        ring: 'border-cyan-500/30',
    },
    emerald: {
        icon: 'text-emerald-300',
        bg: 'bg-emerald-500/10',
        ring: 'border-emerald-500/30',
    },
    amber: {
        icon: 'text-amber-300',
        bg: 'bg-amber-500/10',
        ring: 'border-amber-500/30',
    },
    rose: {
        icon: 'text-rose-300',
        bg: 'bg-rose-500/10',
        ring: 'border-rose-500/30',
    },
};

export default function DashboardOverview() {
    const router = useRouter();
    const { address } = useAccount();
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const fetchStats = useCallback(async () => {
        if (!hasMounted) return;

        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/agent/stats`);
            const payload = response.data?.stats || response.data?.data?.stats || response.data?.data || response.data;

            if (payload) {
                setStats({
                    totalWorkflows: Number(payload.totalWorkflows || 0),
                    runningWorkflows: Number(payload.runningWorkflows || 0),
                    completedWorkflows: Number(payload.completedWorkflows || 0),
                    failedWorkflows: Number(payload.failedWorkflows || 0),
                });
            } else {
                setStats({
                    totalWorkflows: 0,
                    runningWorkflows: 0,
                    completedWorkflows: 0,
                    failedWorkflows: 0,
                });
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({
                totalWorkflows: 0,
                runningWorkflows: 0,
                completedWorkflows: 0,
                failedWorkflows: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [hasMounted]);

    useEffect(() => {
        fetchStats();
    }, [address, fetchStats]);

    const statCards = [
        {
            label: 'Total Workflows',
            value: loading ? '...' : (stats?.totalWorkflows ?? 0).toString(),
            icon: Cpu,
            change: 'All time',
            accent: 'cyan' as const,
        },
        {
            label: 'Running Now',
            value: loading ? '...' : (stats?.runningWorkflows ?? 0).toString(),
            icon: Activity,
            change: 'Live',
            accent: 'amber' as const,
        },
        {
            label: 'Completed',
            value: loading ? '...' : (stats?.completedWorkflows ?? 0).toString(),
            icon: CheckCircle2,
            change: 'Verified',
            accent: 'emerald' as const,
        },
        {
            label: 'Failed',
            value: loading ? '...' : (stats?.failedWorkflows ?? 0).toString(),
            icon: AlertTriangle,
            change: 'Recoverable',
            accent: 'rose' as const,
        },
    ];

    const integrations = [
        {
            title: 'ChainGPT',
            subtitle: 'Research + Audit',
            icon: Brain,
            status: 'Connected',
            network: 'BNB Testnet',
            href: '/dashboard/chat',
        },
        {
            title: 'Unibase Memory',
            subtitle: 'Verifiable AIP',
            icon: Database,
            status: 'Active',
            network: 'Membase Hub',
            href: '/dashboard/memory',
        },
        {
            title: 'Q402 Payments',
            subtitle: 'Delegated spending',
            icon: Shield,
            status: 'Active',
            network: 'BNB Testnet',
            href: '/dashboard/payments',
        },
    ];

    const quickActions = [
        {
            label: 'AI Chat',
            desc: 'Research with ChainGPT',
            href: '/dashboard/chat',
            icon: Brain,
        },
        {
            label: 'Agent Actions',
            desc: 'Execute on-chain tasks',
            href: '/dashboard/actions',
            icon: Activity,
        },
        {
            label: 'Smart Contracts',
            desc: 'Generate, audit, deploy',
            href: '/dashboard/contracts',
            icon: Shield,
        },
    ];

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                <p className="text-slate-400">
                    Real-time orchestrator performance and workflow health at a glance.
                </p>
                {lastUpdated ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                        Updated {lastUpdated.toLocaleTimeString()}
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${accentStyles[stat.accent].bg} ${accentStyles[stat.accent].ring} border`}>
                                <stat.icon className={`w-6 h-6 ${accentStyles[stat.accent].icon}`} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
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

            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Integration Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {integrations.map((item) => (
                        <button
                            key={item.title}
                            onClick={() => router.push(item.href)}
                            className="text-left bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full">
                                    {item.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{item.subtitle}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white/60"></span>
                                    {item.network}
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => router.push(action.href)}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold mb-1">{action.label}</h3>
                                    <p className="text-sm text-slate-400">{action.desc}</p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
