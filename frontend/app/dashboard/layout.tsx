'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, Wallet } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isConnected, isConnecting } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-[100dvh] bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (!isConnected && !isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] bg-black text-white p-4">
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-md w-full">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Connect Wallet</h2>
                    <p className="text-sm text-slate-400 mb-6">
                        Connect your wallet to access ClawOS.
                    </p>
                    <div className="scale-105">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] bg-black text-white">
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar onMenuToggle={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 scrollbar-thin bg-black">
                    {children}
                </main>
            </div>
        </div>
    );
}
