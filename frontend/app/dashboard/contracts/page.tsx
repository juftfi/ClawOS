'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
    FileCode,
    Shield,
    Rocket,
    Loader2,
    AlertTriangle,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { X402PaymentFlow } from '@/components/x402/PaymentFlow';
import axios from 'axios';
import { trackEvent } from '@/lib/analytics';

interface AuditResult {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    line?: number;
}

const severityStyles = {
    critical: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-300',
        icon: XCircle,
    },
    high: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-300',
        icon: AlertTriangle,
    },
    medium: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-300',
        icon: AlertTriangle,
    },
    low: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-300',
        icon: CheckCircle,
    },
    info: {
        bg: 'bg-white/5',
        border: 'border-white/10',
        text: 'text-white/70',
        icon: CheckCircle,
    },
};

export default function ContractsPage() {
    const { address, isConnected } = useAccount();
    const [mode, setMode] = useState<'generate' | 'audit'>('generate');
    const [description, setDescription] = useState('');
    const [contractCode, setContractCode] = useState('');
    const [generating, setGenerating] = useState(false);
    const [auditing, setAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [deployData, setDeployData] = useState<any>(null);

    const networkName = 'bnb-testnet';

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setGenerating(true);
        trackEvent('contract_generate_start');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/ai/generate-contract`, {
                description,
                network: networkName,
            });

            if (response.data.success) {
                setContractCode(response.data.data.contract_code);
                trackEvent('contract_generate_success');
            }
        } catch (error) {
            console.error('Contract generation failed:', error);
            trackEvent('contract_generate_error');
        } finally {
            setGenerating(false);
        }
    };

    const handleAudit = async () => {
        if (!contractCode.trim()) return;

        setAuditing(true);
        setAuditResults([]);
        trackEvent('contract_audit_start');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/ai/audit-contract`, {
                contractCode,
                auditType: 'security',
            });

            if (response.data.success) {
                const vulns = response.data.data.vulnerabilities || [];
                const findings = vulns.map((v: any) => ({
                    severity: (v.severity || 'medium').toLowerCase(),
                    title: v.name || 'Security Issue',
                    description: v.description || 'Potential vulnerability detected',
                    line: v.location ? parseInt(v.location, 10) : undefined,
                }));
                setAuditResults(findings);
                trackEvent('contract_audit_success');
            }
        } catch (error) {
            console.error('Contract audit failed:', error);
            trackEvent('contract_audit_error');
        } finally {
            setAuditing(false);
        }
    };

    const handleDeploy = () => {
        setDeployData({
            code: contractCode,
            network: networkName,
        });
        setShowPayment(true);
        trackEvent('contract_deploy_init');
    };

    const handlePaymentSuccess = async (txHash: string) => {
        setShowPayment(false);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/blockchain/deploy-contract`, {
                code: contractCode,
                network: networkName,
                paymentTxHash: txHash,
            });

            if (response.data.success) {
                alert(`Contract deployed at: ${response.data.address}`);
                trackEvent('contract_deploy_success');
            }
        } catch (error) {
            console.error('Deployment failed:', error);
            trackEvent('contract_deploy_error');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Smart Contracts</h1>
                <p className="text-slate-400">Generate, audit, and deploy contracts with ChainGPT AI.</p>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setMode('generate')}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'generate'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                >
                    <FileCode className="w-5 h-5 inline mr-2" />
                    Generate Contract
                </button>
                <button
                    onClick={() => setMode('audit')}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'audit'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                >
                    <Shield className="w-5 h-5 inline mr-2" />
                    Audit Contract
                </button>
            </div>

            {mode === 'generate' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Describe Your Contract</h2>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Create an ERC-20 token with 1 million supply, named 'MyToken' with symbol 'MTK'"
                        rows={4}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none mb-4"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!description.trim() || generating}
                        className="px-6 py-3 bg-white text-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileCode className="w-5 h-5" />
                                Generate with ChainGPT
                            </>
                        )}
                    </button>
                </div>
            )}

            {contractCode && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Contract Code</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAudit}
                                disabled={auditing}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {auditing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Auditing...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Audit
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDeploy}
                                disabled={!isConnected}
                                className="px-4 py-2 bg-white text-black disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Rocket className="w-4 h-4" />
                                Deploy
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={contractCode}
                        onChange={(e) => setContractCode(e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
                    />
                </div>
            )}

            {mode === 'audit' && !contractCode && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Paste Contract Code</h2>
                    <textarea
                        value={contractCode}
                        onChange={(e) => setContractCode(e.target.value)}
                        placeholder="pragma solidity ^0.8.0;..."
                        rows={15}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none mb-4"
                    />
                    <button
                        onClick={handleAudit}
                        disabled={!contractCode.trim() || auditing}
                        className="px-6 py-3 bg-white text-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {auditing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Auditing...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Audit with ChainGPT
                            </>
                        )}
                    </button>
                </div>
            )}

            {auditResults.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Security Audit Results</h2>
                    <div className="space-y-3">
                        {auditResults.map((result, i) => {
                            const style = severityStyles[result.severity] || severityStyles.info;
                            const Icon = style.icon;

                            return (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 p-4 ${style.bg} ${style.border} border rounded-lg`}
                                >
                                    <Icon className={`w-5 h-5 ${style.text} flex-shrink-0 mt-0.5`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`${style.text} font-semibold uppercase text-xs`}>
                                                {result.severity}
                                            </span>
                                            <span className="text-white font-medium">{result.title}</span>
                                        </div>
                                        <p className={`text-sm ${style.text}`}>{result.description}</p>
                                        {result.line && (
                                            <p className="text-xs text-white/40 mt-1">Line {result.line}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showPayment && (
                <X402PaymentFlow
                    serviceType="deploy"
                    agentId={address}
                    actionData={deployData}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPayment(false)}
                />
            )}
        </div>
    );
}
