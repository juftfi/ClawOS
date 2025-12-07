'use client';

import { useNetwork, useSwitchNetwork } from 'wagmi';
import { baseSepolia, bscTestnet } from 'wagmi/chains';
import { Globe, AlertTriangle } from 'lucide-react';

export function NetworkToggle() {
    const { chain } = useNetwork();
    const { switchNetwork, isLoading } = useSwitchNetwork();

    const networks = [
        {
            chain: baseSepolia,
            name: 'Base Sepolia',
            description: 'AWE Network + ChainGPT',
            token: 'USDC',
            color: 'blue'
        },
        {
            chain: bscTestnet,
            name: 'BNB Testnet',
            description: 'Quack × ChainGPT',
            token: 'USDT',
            color: 'yellow'
        }
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Network</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                {networks.map((network) => {
                    const isActive = chain?.id === network.chain.id;

                    return (
                        <button
                            key={network.chain.id}
                            onClick={() => switchNetwork?.(network.chain.id)}
                            disabled={isLoading || isActive}
                            className={`
                                p-3 rounded-lg border-2 transition-all text-left
                                ${isActive
                                    ? `border-${network.color}-500 bg-${network.color}-500/10`
                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                }
                                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${isActive ? `text-${network.color}-400` : 'text-white'}`}>
                                    {network.name}
                                </span>
                                {isActive && (
                                    <div className={`w-2 h-2 rounded-full bg-${network.color}-500`}></div>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mb-1">{network.description}</p>
                            <p className="text-xs text-slate-500">Token: {network.token}</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-start gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300">
                    <strong>TESTNET ONLY</strong> - Safe for demo. No real funds at risk.
                </p>
            </div>
        </div>
    );
}
