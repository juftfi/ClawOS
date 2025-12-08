'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Send, ArrowRightLeft, Rocket, Phone, Shield, DollarSign, AlertTriangle } from 'lucide-react';
import { X402PaymentFlow } from '@/components/x402/PaymentFlow';
import axios from 'axios';

type ActionType = 'transfer' | 'swap' | 'deploy' | 'call';

interface ActionFormData {
    type: ActionType;
    // Transfer
    toAddress?: string;
    amount?: string;
    token?: string;
    // Swap
    fromToken?: string;
    toToken?: string;
    swapAmount?: string;
    // Deploy
    contractCode?: string;
    constructorArgs?: string;
    // Call
    contractAddress?: string;
    functionName?: string;
    functionArgs?: string;
}

export default function ActionsPage() {
    const { address, isConnected, chain } = useAccount();
    const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
    const [formData, setFormData] = useState<ActionFormData>({ type: 'transfer' });
    const [showPayment, setShowPayment] = useState(false);
    const [actionData, setActionData] = useState<any>(null);
    const [txHistory, setTxHistory] = useState<any[]>([]);

    const isBaseSepolia = chain?.id === 84532;
    const isBNBTestnet = chain?.id === 97;

    const [hasMounted, setHasMounted] = useState(false);

    // Fix hydration mismatch
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Show loading until mounted
    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    const actions = [
        {
            type: 'transfer' as ActionType,
            icon: Send,
            title: 'Transfer Tokens',
            description: 'Send tokens to any address',
            color: 'purple',
            networks: ['base-sepolia', 'bsc-testnet']
        },
        {
            type: 'swap' as ActionType,
            icon: ArrowRightLeft,
            title: 'Swap Tokens',
            description: 'Exchange tokens via DEX',
            color: 'blue',
            networks: ['bsc-testnet']
        },
        {
            type: 'deploy' as ActionType,
            icon: Rocket,
            title: 'Deploy Contract',
            description: 'Deploy smart contract on-chain',
            color: 'emerald',
            networks: ['base-sepolia', 'bsc-testnet']
        },
        {
            type: 'call' as ActionType,
            icon: Phone,
            title: 'Call Contract',
            description: 'Execute contract function',
            color: 'orange',
            networks: ['base-sepolia', 'bsc-testnet']
        }
    ].filter(action => {
        if (!chain) return true;
        if (isBaseSepolia) return action.networks.includes('base-sepolia');
        if (isBNBTestnet) return action.networks.includes('bsc-testnet');
        return true;
    });

    const handleExecute = async () => {
        if (!address) return;

        // Prepare action data for x402 payment
        const data = {
            actionType: selectedAction,
            ...formData,
            executor: address
        };

        setActionData(data);
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (txHash: string) => {
        setShowPayment(false);

        // Execute the actual action via backend
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/agent/execute-action`, {
                actionType: selectedAction,
                actionData,
                paymentTxHash: txHash
            });

            if (response.data.success) {
                // Add to history
                setTxHistory([
                    {
                        type: selectedAction,
                        txHash: response.data.txHash,
                        timestamp: new Date().toISOString(),
                        status: 'success'
                    },
                    ...txHistory
                ]);

                // Reset form
                setSelectedAction(null);
                setFormData({ type: 'transfer' });
            }
        } catch (error) {
            console.error('Action execution failed:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Agent Actions</h1>
                    <p className="text-slate-400">Execute on-chain operations powered by AI agents</p>
                </div>
                {/* Network Badge */}
                <div className={`px-4 py-2 rounded-lg border ${isBaseSepolia ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    isBNBTestnet ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {chain?.name || 'Unsupported Network'}
                </div>
            </div>

            {/* Unsupported Network Warning */}
            {!isBaseSepolia && !isBNBTestnet && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex flex-col items-center text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Unsupported Network</h3>
                    <p className="text-slate-400 max-w-md">
                        Please switch to Base Sepolia or BNB Testnet to use Agent Actions.
                    </p>
                </div>
            )}

            {/* Action Selection Grid */}
            {!selectedAction && (isBaseSepolia || isBNBTestnet) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {actions.map((action) => (
                        <button
                            key={action.type}
                            onClick={() => {
                                setSelectedAction(action.type);
                                setFormData(prev => ({ ...prev, type: action.type }));
                            }}
                            className={`
                                relative group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 
                                hover:bg-slate-800 transition-all text-left hover:scale-[1.02]
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl mb-4 flex items-center justify-center
                                bg-${action.color}-500/20 text-${action.color}-400 group-hover:bg-${action.color}-500 group-hover:text-white transition-colors
                            `}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                            <p className="text-slate-400">{action.description}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Action Form */}
            {selectedAction && !showPayment && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {actions.find(a => a.type === selectedAction)?.title}
                        </h2>
                        <button
                            onClick={() => setSelectedAction(null)}
                            className="text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Transfer Form */}
                    {selectedAction === 'transfer' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Address</label>
                                <input
                                    type="text"
                                    value={formData.toAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, toAddress: e.target.value })}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                                <input
                                    type="text"
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
                                <select
                                    value={formData.token || 'USDC'}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="USDC">USDC</option>
                                    <option value="ETH">ETH</option>
                                    <option value="BNB">BNB</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Swap Form */}
                    {selectedAction === 'swap' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
                                    <select
                                        value={formData.fromToken || 'USDC'}
                                        onChange={(e) => setFormData({ ...formData, fromToken: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="USDC">USDC</option>
                                        <option value="BNB">BNB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
                                    <select
                                        value={formData.toToken || 'AWE'}
                                        onChange={(e) => setFormData({ ...formData, toToken: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="AWE">AWE</option>
                                        <option value="CGPT">CGPT</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.swapAmount || ''}
                                        onChange={(e) => setFormData({ ...formData, swapAmount: e.target.value })}
                                        placeholder="0.0"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        {formData.fromToken || 'USDC'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deploy Form */}
                    {selectedAction === 'deploy' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Contract Bytecode</label>
                                <textarea
                                    value={formData.contractCode || ''}
                                    onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
                                    placeholder="0x..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Constructor Arguments (JSON)</label>
                                <input
                                    type="text"
                                    value={formData.constructorArgs || ''}
                                    onChange={(e) => setFormData({ ...formData, constructorArgs: e.target.value })}
                                    placeholder='["arg1", 123]'
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                />
                            </div>
                        </div>
                    )}

                    {/* Call Form */}
                    {selectedAction === 'call' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Contract Address</label>
                                <input
                                    type="text"
                                    value={formData.contractAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Function Name</label>
                                <input
                                    type="text"
                                    value={formData.functionName || ''}
                                    onChange={(e) => setFormData({ ...formData, functionName: e.target.value })}
                                    placeholder="transfer"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Function Arguments (JSON)</label>
                                <input
                                    type="text"
                                    value={formData.functionArgs || ''}
                                    onChange={(e) => setFormData({ ...formData, functionArgs: e.target.value })}
                                    placeholder='["0x...", "1000000"]'
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                />
                            </div>
                        </div>
                    )}

                    {/* Security Warning */}
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-6">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-300">
                            <strong>Security Check:</strong> This action will be verified against your spend caps and allow/deny lists before execution.
                        </div>
                    </div>

                    {/* Execute Button */}
                    <button
                        onClick={handleExecute}
                        disabled={!isConnected}
                        className="w-full mt-6 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <Shield className="w-5 h-5" />
                        Execute with x402 Payment
                    </button>
                </div>
            )}

            {/* x402 Payment Flow */}
            {showPayment && (
                <X402PaymentFlow
                    serviceType={selectedAction as any}
                    agentId={address}
                    actionData={actionData}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPayment(false)}
                />
            )}

            {/* Transaction History */}
            {txHistory.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Actions</h3>
                    <div className="space-y-3">
                        {txHistory.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-white font-medium capitalize">{tx.type}</span>
                                </div>
                                <a
                                    href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-purple-400 hover:text-purple-300 font-mono"
                                >
                                    {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

