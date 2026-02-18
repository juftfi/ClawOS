'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {
    Shield,
    DollarSign,
    CheckCircle,
    XCircle,
    Plus,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import axios from 'axios';

interface SpendCap {
    id: string;
    type: 'daily' | 'weekly' | 'per-action';
    limit: string;
    current: string;
}

interface AllowDenyList {
    id: string;
    address: string;
    type: 'allow' | 'deny';
    reason: string;
}

export default function SecurityPage() {
    const { address, isConnected } = useAccount();
    const [spendCaps, setSpendCaps] = useState<SpendCap[]>([]);
    const [allowDenyList, setAllowDenyList] = useState<AllowDenyList[]>([]);
    const [newCap, setNewCap] = useState({ type: 'daily', limit: '' });
    const [newListEntry, setNewListEntry] = useState({ address: '', type: 'allow', reason: '' });
    const [loading, setLoading] = useState(true);

    const loadSecuritySettings = useCallback(async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            const capsRes = await axios.get(`${API_URL}/api/security/spend-caps?wallet=${address}`);
            if (capsRes.data.success) {
                setSpendCaps(capsRes.data.caps || []);
            }

            const listsRes = await axios.get(`${API_URL}/api/security/allow-deny-lists?wallet=${address}`);
            if (listsRes.data.success) {
                setAllowDenyList(listsRes.data.lists || []);
            }
        } catch (error) {
            console.error('Failed to load security settings:', error);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected && address) {
            loadSecuritySettings();
        }
    }, [address, isConnected, loadSecuritySettings]);

    const addSpendCap = async () => {
        if (!newCap.limit || !address) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/security/spend-caps`, {
                wallet: address,
                type: newCap.type,
                limit: newCap.limit,
            });

            if (response.data.success) {
                setSpendCaps([...spendCaps, response.data.cap]);
                setNewCap({ type: 'daily', limit: '' });
            }
        } catch (error) {
            console.error('Failed to add spend cap:', error);
        }
    };

    const removeSpendCap = async (id: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            await axios.delete(`${API_URL}/api/security/spend-caps/${id}`);
            setSpendCaps(spendCaps.filter(cap => cap.id !== id));
        } catch (error) {
            console.error('Failed to remove spend cap:', error);
        }
    };

    const addToList = async () => {
        if (!newListEntry.address || !address) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/security/allow-deny-lists`, {
                wallet: address,
                address: newListEntry.address,
                type: newListEntry.type,
                reason: newListEntry.reason,
            });

            if (response.data.success) {
                setAllowDenyList([...allowDenyList, response.data.entry]);
                setNewListEntry({ address: '', type: 'allow', reason: '' });
            }
        } catch (error) {
            console.error('Failed to add to list:', error);
        }
    };

    const removeFromList = async (id: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            await axios.delete(`${API_URL}/api/security/allow-deny-lists/${id}`);
            setAllowDenyList(allowDenyList.filter(entry => entry.id !== id));
        } catch (error) {
            console.error('Failed to remove from list:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Security Settings</h1>
                <p className="text-slate-400">Manage spend caps, allow/deny lists, and transaction policies.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Spend Caps</h2>
                        <p className="text-sm text-slate-400">Set maximum spending limits.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={newCap.type}
                            onChange={(e) => setNewCap({ ...newCap, type: e.target.value as any })}
                            className="px-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="per-action">Per Action</option>
                        </select>
                        <input
                            type="text"
                            value={newCap.limit}
                            onChange={(e) => setNewCap({ ...newCap, limit: e.target.value })}
                            placeholder="Limit (USDC)"
                            className="px-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                        <button
                            onClick={addSpendCap}
                            disabled={!newCap.limit}
                            className="px-4 py-2 bg-white text-black rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Add Cap
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <p className="text-center text-slate-500 py-8">Loading spend caps...</p>
                    ) : spendCaps.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No spend caps configured</p>
                    ) : (
                        spendCaps.map((cap) => {
                            const ratio = Math.min(
                                100,
                                (parseFloat(cap.current) / Math.max(parseFloat(cap.limit), 1)) * 100,
                            );
                            return (
                                <div
                                    key={cap.id}
                                    className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-white font-medium capitalize">{cap.type} Limit</span>
                                            <span className="text-sm text-slate-400">
                                                {cap.current} / {cap.limit} USDC
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${ratio}%` }} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeSpendCap(cap.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-300" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Allow/Deny Lists</h2>
                        <p className="text-sm text-slate-400">Control which addresses can interact.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            value={newListEntry.address}
                            onChange={(e) => setNewListEntry({ ...newListEntry, address: e.target.value })}
                            placeholder="0x..."
                            className="md:col-span-2 px-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono"
                        />
                        <select
                            value={newListEntry.type}
                            onChange={(e) => setNewListEntry({ ...newListEntry, type: e.target.value as any })}
                            className="px-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                            <option value="allow">Allow</option>
                            <option value="deny">Deny</option>
                        </select>
                        <button
                            onClick={addToList}
                            disabled={!newListEntry.address}
                            className="px-4 py-2 bg-white text-black rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <p className="text-center text-slate-500 py-8">Loading lists...</p>
                    ) : allowDenyList.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No addresses in lists</p>
                    ) : (
                        allowDenyList.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {entry.type === 'allow' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-rose-300" />
                                    )}
                                    <div>
                                        <div className="text-white font-mono text-sm">{entry.address}</div>
                                        {entry.reason && (
                                            <div className="text-xs text-slate-400 mt-1">{entry.reason}</div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromList(entry.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-rose-300" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Transaction Preview & Risk Warnings</h2>
                        <p className="text-sm text-slate-400">Automatic security checks before execution.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {[
                        'Spend Cap Verification: All transactions are checked against configured limits.',
                        'Address Filtering: Transactions to denied addresses are blocked automatically.',
                        'Risk Analysis: ChainGPT Security API analyzes contract interactions for vulnerabilities.',
                        'Transaction Log: All actions are logged to Membase for audit trail.',
                    ].map((item) => (
                        <div
                            key={item}
                            className="flex items-start gap-3 p-3 bg-black/40 border border-white/10 rounded-lg"
                        >
                            <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-300">{item}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
