'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, Wallet, Terminal } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isConnected, isConnecting } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-[100dvh] bg-white dark:bg-surface-950">
                <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
            </div>
        );
    }

    if (!isConnected && !isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] bg-white dark:bg-surface-950 px-4">
                <div className="glass neon-border rounded-2xl p-8 flex flex-col items-center text-center max-w-sm w-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center mb-5 shadow-neon-cyan">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Connect Wallet</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Connect your wallet to access AgentOS.
                    </p>
                    <div className="scale-105">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] bg-slate-50 dark:bg-surface-950 transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <TopBar onMenuToggle={() => setSidebarOpen(true)} />

                {/* Page content - safe area for mobile bottom nav */}
                <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6 scrollbar-thin">
                    {children}
                </main>
            </div>
        </div>
    );
}
