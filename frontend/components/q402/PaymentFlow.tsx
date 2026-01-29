'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { AlertCircle, CheckCircle, Loader2, Shield, DollarSign } from 'lucide-react';
import axios from 'axios';

interface PaymentFlowProps {
    serviceType: 'agent-creation' | 'agent-query' | 'agent-action' | 'contract-deploy' | 'contract-call' | 'swap' | 'transfer';
    agentId?: string;
    onSuccess: (txHash: string) => void;
    onCancel: () => void;
    actionData?: any;
}

const ERC20_ABI = [
    {
        inputs: [{ name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

export function Q402PaymentFlow({ serviceType, agentId, onSuccess, onCancel, actionData }: PaymentFlowProps) {
    const { address, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [step, setStep] = useState<'preview' | 'signing' | 'confirming' | 'success' | 'error'>('preview');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [txHash, setTxHash] = useState<string>('');
    const [error, setError] = useState<string>('');

    // BNB Testnet Configuration
    const isBnbTestnet = chain?.id === 97;

    const networkConfig = {
        name: 'BNB Testnet',
        protocol: 'Q402 (EIP-7702)',
        usdcAddress: '0x64544969ed7EBf5f083679233325356EbE738930', // USDC on BNB Testnet
        explorer: 'https://testnet.bscscan.com'
    };

    const servicePricing: Record<string, { amount: string, description: string }> = {
        'agent-creation': { amount: '1.00', description: 'Create new AI agent' },
        'agent-query': { amount: '0.10', description: 'Query agent for research' },
        'agent-action': { amount: '0.25', description: 'Execute agent action' },
        'contract-deploy': { amount: '2.00', description: 'Deploy smart contract' },
        'contract-call': { amount: '0.50', description: 'Execute contract function' },
        'swap': { amount: '0.50', description: 'Swap tokens via DEX' },
        'transfer': { amount: '0.25', description: 'Transfer tokens' }
    };

    const handlePayment = async () => {
        if (!address || !isBnbTestnet) {
            setError('Please connect to BNB Testnet');
            setStep('error');
            return;
        }

        if (!walletClient) {
            setError('Wallet client not ready');
            setStep('error');
            return;
        }

        try {
            setStep('signing');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            // 2026 Unified Execution Workflow (Sign-to-Pay)
            const executeReq = await axios.post(`${API_URL}/api/quack/execute`, {
                agentId: agentId || 'primary-orchestrator',
                serviceType,
                params: actionData || {}
            });

            if (!executeReq.data.success) {
                throw new Error('Failed to initialize Unified Execution');
            }

            const { executionId, signMessage } = executeReq.data;

            // Step 1: Request delegation signature (EIP-7702 style)
            const signature = await walletClient.signMessage({
                account: address,
                message: signMessage
            });

            setStep('confirming');

            // Step 2: Execute the on-chain transaction (Simulated or via publicClient)
            // In a real EIP-7702 flow, the signature is bundled with the execution.
            // For the prototype, we simulate the on-chain hash.
            const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
            setTxHash(mockTxHash);

            // Step 3: Process receipt in backend
            await axios.post(`${API_URL}/api/quack/process-receipt`, {
                executionId,
                signature,
                txHash: mockTxHash
            });

            setStep('success');
            setTimeout(() => onSuccess(mockTxHash), 2000);

        } catch (err: any) {
            console.error('Unified Execution error:', err);
            setError(err.message || 'Execution failed');
            setStep('error');
        }
    };

    const pricing = servicePricing[serviceType] || { amount: '0.10', description: 'Service Fee' };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Q402 Payment Required</h2>
                        <p className="text-sm text-slate-400">Secure on-chain payment on BNB Testnet</p>
                    </div>
                </div>

                {step === 'preview' && (
                    <>
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Service</span>
                                <span className="text-white font-medium">{pricing.description}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Amount</span>
                                <span className="text-white font-bold text-lg">{pricing.amount} USDC</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Network</span>
                                <span className="text-yellow-400">{networkConfig.name}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors">Cancel</button>
                            <button onClick={handlePayment} className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Pay {pricing.amount} USDC
                            </button>
                        </div>
                    </>
                )}

                {step === 'signing' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Preparing Q402 Transfer...</h3>
                    </div>
                )}

                {step === 'confirming' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Confirming Transaction...</h3>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Payment Successful!</h3>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Payment Failed</h3>
                        <p className="text-sm text-slate-400 mb-6">{error}</p>
                        <button onClick={onCancel} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
