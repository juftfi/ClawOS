'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
    Database,
    ShieldCheck,
    History,
    Search,
    RefreshCw,
    Cpu,
    Brain,
    Lock,
    Loader2,
} from 'lucide-react';
import axios from 'axios';

const statStyles = {
    primary: {
        bg: 'bg-white/5',
        border: 'border-white/10',
        icon: 'text-white',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-300',
    },
    cyan: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        icon: 'text-cyan-300',
    },
};

export default function MemoryPage() {
    const { isConnected } = useAccount();
    const [memoryItems, setMemoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRecords: 0,
        verifiableProofs: 0,
        storageType: 'Unibase AIP',
    });

    const fetchMemory = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/memory/aip/query/primary-orchestrator`);

            if (response.data.success) {
                setMemoryItems(response.data.data);
                setStats({
                    totalRecords: response.data.data.length,
                    verifiableProofs: response.data.data.filter((item: any) => item.metadata?.verifiable).length,
                    storageType: 'Unibase AIP Protocol',
                });
            }
        } catch (err) {
            console.error('Failed to fetch memory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) fetchMemory();
    }, [isConnected]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Immortal Memory</h1>
                    <p className="text-slate-400">
                        Verifiable persistent storage for the Agent Orchestrator via Unibase AIP.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <span className="text-sm font-medium text-emerald-200">zk-SNARK Verifiable</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Total Memory Logs',
                        value: stats.totalRecords,
                        icon: Database,
                        style: statStyles.primary,
                    },
                    {
                        label: 'Verifiable Proofs',
                        value: stats.verifiableProofs,
                        icon: Lock,
                        style: statStyles.emerald,
                    },
                    {
                        label: 'Protocol Standard',
                        value: stats.storageType,
                        icon: Cpu,
                        style: statStyles.cyan,
                    },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.style.bg} ${stat.style.border} border flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.style.icon}`} />
                            </div>
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-semibold">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-white/60" />
                        AIP Memory Logs
                    </h3>
                    <button
                        onClick={fetchMemory}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Accessing Unibase Hub...</p>
                    </div>
                ) : memoryItems.length > 0 ? (
                    <div className="divide-y divide-white/10">
                        {memoryItems.map((item, i) => (
                            <div key={i} className="p-6 hover:bg-white/5 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-cyan-300" />
                                            <span className="text-xs font-mono text-white/40 uppercase">{item.id}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
                                        <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <span className="text-[10px] text-white/40 font-mono">
                                                TIMESTAMP: {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                            {item.metadata?.verifiable && (
                                                <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    ZK-PROOF VERIFIED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span title="Inspect IPFS Content" className="inline-flex">
                                        <Search className="w-5 h-5 text-white/30 cursor-help" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <p>No verifiable memory logs found for this agent.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
