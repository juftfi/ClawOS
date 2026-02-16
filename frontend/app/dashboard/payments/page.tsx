'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import axios from 'axios';
import { trackEvent } from '@/lib/analytics';

interface Payment {
    paymentId: string;
    txHash?: string;
    amount: string;
    serviceType?: string;
    status: string;
    confirmedAt?: string;
    acceptedAt?: string;
}

export default function PaymentsPage() {
    const { isConnected } = useAccount();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVolume, setTotalVolume] = useState<number>(0);
    const [hasMounted, setHasMounted] = useState(false);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/api/quack/payment/history`);

            if (response.data && response.data.history) {
                setPayments(response.data.history);
                const total = response.data.history.reduce((acc: number, curr: Payment) => {
                    let val = 0;
                    if (typeof curr.amount === 'string' && curr.amount.includes('USDC')) {
                        val = parseFloat(curr.amount.split(' ')[0]);
                    } else {
                        val = parseFloat(curr.amount) / 1000000;
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

    useEffect(() => {
        setHasMounted(true);
        fetchHistory();
    }, []);

    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    if (!isConnected) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <DollarSign className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-slate-400 mb-6">Connect your wallet to view payment history</p>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Q402 Payments</h1>
                    <p className="text-slate-400">Real-time value flow on BNB Testnet.</p>
                </div>
                <button
                    onClick={() => {
                        trackEvent('payments_refresh');
                        fetchHistory();
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

                <div className="relative z-10">
                    <p className="text-white/60 font-medium mb-1">Total Network Volume</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">
                            {totalVolume.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                        <span className="text-xl text-white/60">USDC</span>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button
                            className="px-6 py-3 bg-white text-black rounded-xl font-semibold transition-all flex items-center gap-2 opacity-50 cursor-not-allowed"
                            title="Connect Wallet to Send"
                        >
                            <ArrowUpRight className="w-5 h-5" /> Send
                        </button>
                        <button
                            className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition-all flex items-center gap-2 opacity-50 cursor-not-allowed"
                            title="Connect Wallet to Receive"
                        >
                            <ArrowDownLeft className="w-5 h-5" /> Receive
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-white/60" />
                    Recent Transactions
                </h2>

                {payments.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500">
                        No transactions found yet. Create an agent or request a service to see activity.
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        {payments
                            .slice()
                            .reverse()
                            .map((tx, i) => (
                                <div
                                    key={tx.paymentId}
                                    className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
                                        i !== payments.length - 1 ? 'border-b border-white/10' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white">
                                            <ArrowDownLeft className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{tx.serviceType || 'Payment'}</p>
                                            <p className="text-xs text-slate-500">
                                                {tx.txHash
                                                    ? `Tx: ${tx.txHash.substring(0, 6)}...${tx.txHash.substring(
                                                          tx.txHash.length - 4
                                                      )}`
                                                    : 'Pending'}{' '}
                                                |{' '}
                                                {tx.confirmedAt
                                                    ? new Date(tx.confirmedAt).toLocaleTimeString()
                                                    : new Date(tx.acceptedAt || Date.now()).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-300">+{tx.amount}</p>
                                        <p className="text-xs text-white/50 capitalize">{tx.status}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
