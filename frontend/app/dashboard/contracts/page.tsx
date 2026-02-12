'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FileCode, Shield, Rocket, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { X402PaymentFlow } from '@/components/x402/PaymentFlow';
import axios from 'axios';

interface AuditResult {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    line?: number;
}

export default function ContractsPage() {
    const { address, isConnected, chain } = useAccount();
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

    // Fix hydration mismatch
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Show loading until mounted
    if (!hasMounted) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setGenerating(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/ai/generate-contract`, {
                description,
                network: networkName
            });

            if (response.data.success) {
                setContractCode(response.data.data.contract_code);
            }
        } catch (error) {
            console.error('Contract generation failed:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleAudit = async () => {
        if (!contractCode.trim()) return;

        setAuditing(true);
        setAuditResults([]);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/ai/audit-contract`, {
                contractCode: contractCode,
                auditType: 'security'
            });

            if (response.data.success) {
                const vulns = response.data.data.vulnerabilities || [];
                // Map auditor service vulnerabilities to UI format
                const findings = vulns.map((v: any, index: number) => ({
                    severity: (v.severity || 'medium').toLowerCase(),
                    title: v.name || 'Security Issue',
                    description: v.description || 'Potential vulnerability detected',
                    line: v.location ? parseInt(v.location) : undefined
                }));
                setAuditResults(findings);
            }
        } catch (error) {
            console.error('Contract audit failed:', error);
        } finally {
            setAuditing(false);
        }
    };

    const handleDeploy = () => {
        setDeployData({
            code: contractCode,
            network: networkName
        });
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (txHash: string) => {
        setShowPayment(false);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/blockchain/deploy-contract`, {
                code: contractCode,
                network: networkName,
                paymentTxHash: txHash
            });

            if (response.data.success) {
                alert(`Contract deployed at: ${response.data.address}`);
            }
        } catch (error) {
            console.error('Deployment failed:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'blue';
            default: return 'slate';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
            case 'high':
                return XCircle;
            case 'medium':
                return AlertTriangle;
            default:
                return CheckCircle;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Smart Contracts</h1>
                <p className="text-slate-400">Generate, audit, and deploy contracts with ChainGPT AI</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-4">
                <button
                    onClick={() => setMode('generate')}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'generate'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <FileCode className="w-5 h-5 inline mr-2" />
                    Generate Contract
                </button>
                <button
                    onClick={() => setMode('audit')}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'audit'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Shield className="w-5 h-5 inline mr-2" />
                    Audit Contract
                </button>
            </div>

            {/* Generate Mode */}
            {mode === 'generate' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Describe Your Contract</h2>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Create an ERC-20 token with 1 million supply, named 'MyToken' with symbol 'MTK'"
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!description.trim() || generating}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
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

            {/* Contract Code Editor */}
            {contractCode && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Contract Code</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAudit}
                                disabled={auditing}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
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
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                </div>
            )}

            {/* Audit Mode */}
            {mode === 'audit' && !contractCode && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Paste Contract Code</h2>
                    <textarea
                        value={contractCode}
                        onChange={(e) => setContractCode(e.target.value)}
                        placeholder="pragma solidity ^0.8.0;..."
                        rows={15}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
                    />
                    <button
                        onClick={handleAudit}
                        disabled={!contractCode.trim() || auditing}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
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

            {/* Audit Results */}
            {auditResults.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Security Audit Results</h2>
                    <div className="space-y-3">
                        {auditResults.map((result, i) => {
                            const color = getSeverityColor(result.severity);
                            const Icon = getSeverityIcon(result.severity);

                            return (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 p-4 bg-${color}-500/10 border border-${color}-500/20 rounded-lg`}
                                >
                                    <Icon className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-${color}-400 font-semibold uppercase text-xs`}>
                                                {result.severity}
                                            </span>
                                            <span className="text-white font-medium">{result.title}</span>
                                        </div>
                                        <p className={`text-sm text-${color}-300`}>{result.description}</p>
                                        {result.line && (
                                            <p className="text-xs text-slate-500 mt-1">Line {result.line}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* x402 Payment Flow */}
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
