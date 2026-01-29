'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Search, Zap, Repeat, Cpu, Shield, AlertCircle, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Q402PaymentFlow } from '@/components/q402/PaymentFlow';

export default function ActionsPage() {
    const { address, isConnected, chain } = useAccount();
    const [actionStatus, setActionStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Dynamic state for form inputs (simplified for now)
    const [formData] = useState({
        network: 'bnb-testnet'
    });

    const isBNBTestnet = chain?.id === 97;

    const actionTypes = [
        {
            id: 'agent-query',
            name: 'ChainGPT Research',
            description: 'Advanced Web3 research and social analysis powered by ChainGPT.',
            icon: Search,
            cost: '0.10 USDC',
            category: 'Intelligence'
        },
        {
            id: 'contract-deploy',
            name: 'Agent Deployment',
            description: 'Deploy a custom smart contract verified by ChainGPT Audit.',
            icon: Zap,
            cost: '2.00 USDC',
            category: 'Execution'
        },
        {
            id: 'swap',
            name: 'DeFi Swap',
            description: 'Execute a token swap on BNB Chain via Agent Orchestrator.',
            icon: Repeat,
            cost: '0.50 USDC',
            category: 'DeFi'
        },
        {
            id: 'contract-call',
            name: 'Interact with Contract',
            description: 'Execute any smart contract function on BNB Testnet.',
            icon: Cpu,
            cost: '0.50 USDC',
            category: 'Web3'
        }
    ];

    const handleActionClick = (actionId: string) => {
        if (!isBNBTestnet) {
            alert('Please switch to BNB Testnet to execute actions.');
            return;
        }
        setActiveAction(actionId);
        setActionStatus('idle');
    };

    const handlePaymentSuccess = async (txHash: string) => {
        setActionStatus('executing');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            // Simulate small delay for "Agent Processing"
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Execute the actual backend agent workflow
            const response = await axios.post(`${API_URL}/api/agent/execute-action`, {
                actionType: activeAction,
                actionData: {
                    ...formData,
                    userId: address,
                    paymentTxHash: txHash
                }
            });

            if (response.data.success) {
                setActionStatus('success');
            } else {
                throw new Error(response.data.error || 'Execution failed');
            }
        } catch (err: any) {
            setError(err.message || 'Action execution failed');
            setActionStatus('error');
        }
    };

    // Hydration fix
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Agent Actions</h1>
                    <p className="text-slate-400">Execute on-chain operations using the Q402 protocol on BNB Chain.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-300">Q402 Protected</span>
                </div>
            </div>

            {/* Hub V2 Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Market Narratives */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Cpu className="w-24 h-24 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Market Narrative</h3>
                            <p className="text-xs text-slate-500">Powered by ChainGPT Hub V2</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <p className="text-sm text-slate-300">
                                <span className="text-yellow-400 font-bold mr-2">BULLISH:</span>
                                AI-Agent interoperability narrative is surfacing as BNB Chain initiates Q402/EIP-7702 upgrades.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sentiment: High</span>
                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">Fear/Greed: 68</span>
                        </div>
                    </div>
                </div>

                {/* Trading Assistant */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Trading Edge</h3>
                            <p className="text-xs text-slate-500">Liquidation Heatmap Active</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-800/30 p-2 rounded-lg">
                            <span className="text-xs text-slate-400">Support Level</span>
                            <span className="text-xs font-mono text-emerald-400">$2,450.20</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/30 p-2 rounded-lg">
                            <span className="text-xs text-slate-400">Resistance Level</span>
                            <span className="text-xs font-mono text-red-400">$2,580.45</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/50 w-[72%]" />
                        </div>
                        <p className="text-[10px] text-center text-slate-500">Predictive analysis updated 2m ago</p>
                    </div>
                </div>
            </div>

            {/* Network Check */}
            {!isBNBTestnet && isConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Switch to BNB Testnet</h3>
                            <p className="text-slate-400">Agent actions are exclusively available on BNB Smart Chain Testnet.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actionTypes.map((action) => (
                    <div
                        key={action.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-yellow-500/10 transition-colors">
                                    <action.icon className="w-6 h-6 text-slate-400 group-hover:text-yellow-400" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">
                                        {action.category}
                                    </span>
                                    <h3 className="font-bold text-white text-lg">{action.name}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-500">Service Fee</span>
                                <p className="font-bold text-white">{action.cost}</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            {action.description}
                        </p>

                        <button
                            onClick={() => handleActionClick(action.id)}
                            disabled={!isBNBTestnet || actionStatus === 'executing'}
                            className="w-full py-3 bg-slate-800 hover:bg-yellow-600 hover:text-white text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            Initialize Action
                        </button>
                    </div>
                ))}
            </div>

            {/* Payment & Execution Flow */}
            {activeAction && (
                <Q402PaymentFlow
                    serviceType={activeAction as any}
                    agentId="primary-orchestrator"
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setActiveAction(null)}
                />
            )}

            {/* Status Modals */}
            {actionStatus === 'executing' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                        <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Agent Executing...</h2>
                        <p className="text-slate-400">
                            The ChainGPT Super Agent is processing your request on-chain.
                        </p>
                    </div>
                </div>
            )}

            {actionStatus === 'success' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Action Successful!</h2>
                        <p className="text-slate-400 mb-8">
                            ChainGPT has successfully executed the task on BNB Testnet.
                        </p>
                        <button
                            onClick={() => {
                                setActionStatus('idle');
                                setActiveAction(null);
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Back to Actions
                        </button>
                    </div>
                </div>
            )}

            {actionStatus === 'error' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Execution Failed</h2>
                        <p className="text-slate-400 mb-8">{error}</p>
                        <button
                            onClick={() => setActionStatus('idle')}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
