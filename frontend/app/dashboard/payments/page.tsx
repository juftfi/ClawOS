'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import axios from 'axios';

interface Payment {
    paymentId: string;
    txHash?: string;
    from?: string;
    to?: string;
    payer?: string;
    recipient?: string;
    amount: string; // "1.000000 USDC" or similar
    serviceType?: string;
    status: string;
    createdAt?: string;
    confirmedAt?: string;
    acceptedAt?: string;
    network?: string;
}

export default function PaymentsPage() {
    const { address, isConnected } = useAccount();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVolume, setTotalVolume] = useState<number>(0);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/awe/payment/history`);

            if (response.data && response.data.history) {
                setPayments(response.data.history);

                // Calculate total volume
                const total = response.data.history.reduce((acc: number, curr: Payment) => {
                    // Parse amount string like "1.000000 USDC" or raw number
                    let val = 0;
                    if (typeof curr.amount === 'string' && curr.amount.includes('USDC')) {
                        val = parseFloat(curr.amount.split(' ')[0]);
                    } else {
                        val = parseFloat(curr.amount) / 1000000; // Assuming raw units if not formatted
                    }
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
                setTotalVolume(total);
            }
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fix hydration mismatch
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        fetchHistory();
    }, []);

    // Show loading or connect prompt only after mount
    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    // Wallet check
    if (!isConnected) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-slate-400 mb-6">Connect your wallet to view payment history</p>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">x402 Payments</h1>
                    <p className="text-slate-400">Real-time value flow on Base Sepolia.</p>
                </div>
                <button
                    onClick={fetchHistory}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Balance/Volume Card */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

                <div className="relative z-10">
                    <p className="text-blue-300 font-medium mb-1">Total Network Volume</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">
                            {totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xl text-blue-300">USDC</span>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 opacity-50 cursor-not-allowed" title="Connect Wallet to Send">
                            <ArrowUpRight className="w-5 h-5" /> Send
                        </button>
                        <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 opacity-50 cursor-not-allowed" title="Connect Wallet to Receive">
                            <ArrowDownLeft className="w-5 h-5" /> Receive
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    Recent Transactions
                </h2>

                {payments.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                        No transactions found yet. Create an agent or request a service to see activity.
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        {payments.slice().reverse().map((tx, i) => (
                            <div
                                key={tx.paymentId}
                                className={`p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${i !== payments.length - 1 ? 'border-b border-slate-800' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500`}>
                                        <ArrowDownLeft className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {tx.serviceType || 'Payment'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {tx.txHash ? `Tx: ${tx.txHash.substring(0, 6)}...${tx.txHash.substring(tx.txHash.length - 4)}` : 'Pending'} • {tx.confirmedAt ? new Date(tx.confirmedAt).toLocaleTimeString() : new Date(tx.acceptedAt || Date.now()).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-400">
                                        +{tx.amount}
                                    </p>
                                    <p className="text-xs text-blue-400 capitalize">{tx.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
