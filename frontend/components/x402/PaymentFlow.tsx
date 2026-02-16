'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { AlertCircle, CheckCircle, Loader2, Shield, DollarSign } from 'lucide-react';
import axios from 'axios';

interface PaymentFlowProps {
    serviceType: 'agent-creation' | 'agent-query' | 'agent-action' | 'transfer' | 'swap' | 'deploy';
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
        type: 'function',
    },
    {
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

const networkConfig = {
    name: 'BNB Testnet',
    protocol: 'Q402',
    usdcAddress: '0x64544969ed7EBf5f083679233325356EbE738930',
    explorer: 'https://testnet.bscscan.com',
};

export function X402PaymentFlow({ serviceType, agentId, onSuccess, onCancel, actionData }: PaymentFlowProps) {
    const { address, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [step, setStep] = useState<'preview' | 'signing' | 'confirming' | 'success' | 'error'>('preview');
    const [txHash, setTxHash] = useState<string>('');
    const [error, setError] = useState<string>('');

    const isBnbTestnet = chain?.id === 97;

    const servicePricing = {
        'agent-creation': { amount: '1.00', description: 'Create new AI agent' },
        'agent-query': { amount: '0.10', description: 'Query agent for research' },
        'agent-action': { amount: '0.50', description: 'Execute agent action' },
        transfer: { amount: '0.25', description: 'Transfer tokens' },
        swap: { amount: '0.50', description: 'Swap tokens via DEX' },
        deploy: { amount: '2.00', description: 'Deploy smart contract' },
    };

    const handlePayment = async () => {
        if (!address) {
            setError('Wallet not connected');
            setStep('error');
            return;
        }

        if (!walletClient) {
            setError('Wallet client not ready. Please try again or check network.');
            setStep('error');
            return;
        }

        if (!isBnbTestnet) {
            setError('Please connect to BNB Smart Chain Testnet.');
            setStep('error');
            return;
        }

        try {
            setStep('signing');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const paymentReq = await axios.post(`${API_URL}/api/quack/payment/request`, {
                agentId: agentId || address,
                serviceType,
                metadata: actionData || {},
                network: 'bnb-testnet',
            });

            if (!paymentReq.data.success) {
                throw new Error('Failed to create payment request');
            }

            const { paymentRequest } = paymentReq.data;

            const usdcAddress = (paymentRequest.token || networkConfig.usdcAddress) as `0x${string}`;
            const recipientAddress = paymentRequest.recipient as `0x${string}`;

            let amountInWei: bigint;
            try {
                const amountStr = paymentRequest.amount?.toString() || '0';
                if (!Number.isInteger(Number(amountStr))) {
                    throw new Error(`Amount must be an integer, got: ${amountStr}`);
                }
                amountInWei = BigInt(amountStr);
            } catch (err: any) {
                throw new Error(`Invalid amount format: ${err.message}`);
            }

            const data = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [recipientAddress, amountInWei],
            });

            setStep('confirming');

            const hash = await walletClient.sendTransaction({
                to: usdcAddress,
                data,
                chain: walletClient.chain,
            });

            setTxHash(hash);

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            await axios.post(`${API_URL}/api/quack/payment/verify`, {
                paymentId: paymentRequest.paymentId || paymentRequest.id,
                txHash: hash,
                payer: address,
                network: 'bnb-testnet',
            });

            setStep('success');
            setTimeout(() => onSuccess(hash), 2000);
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed');
            setStep('error');
        }
    };

    const pricing = servicePricing[serviceType];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Q402 Payment Required</h2>
                        <p className="text-sm text-slate-400">Secure on-chain payment on BNB Testnet</p>
                    </div>
                </div>

                {step === 'preview' && (
                    <>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
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
                                <span className="text-amber-300">{networkConfig.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Protocol</span>
                                <span className="text-emerald-300">{networkConfig.protocol} Standard</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-lg mb-6">
                            <Shield className="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-300">
                                <strong>Policy Protected:</strong> This transaction is verified by {networkConfig.protocol}
                                protocol and includes spend caps and safety checks.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                className="flex-1 px-4 py-3 bg-white text-black rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-white/90"
                            >
                                <DollarSign className="w-4 h-4" />
                                Pay {pricing.amount} USDC
                            </button>
                        </div>
                    </>
                )}

                {step === 'signing' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Preparing Payment...</h3>
                        <p className="text-sm text-slate-400">Creating Q402 payment request</p>
                    </div>
                )}

                {step === 'confirming' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Confirming Transaction...</h3>
                        <p className="text-sm text-slate-400 mb-4">Waiting for blockchain confirmation</p>
                        {txHash && (
                            <a
                                href={`${networkConfig.explorer}/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-white/60 font-mono hover:text-white"
                            >
                                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                            </a>
                        )}
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-emerald-300" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Payment Successful!</h3>
                        <p className="text-sm text-slate-400 mb-4">Transaction confirmed on {networkConfig.name}</p>
                        {txHash && (
                            <a
                                href={`${networkConfig.explorer}/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-white/70 hover:text-white"
                            >
                                View on Explorer
                            </a>
                        )}
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-rose-300" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Payment Failed</h3>
                        <p className="text-sm text-slate-400 mb-6">{error}</p>
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
