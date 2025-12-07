import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, Wallet } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isConnected, isConnecting } = useAccount();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent hydration mismatch by showing loading or nothing until mounted
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // BLOCKING: If wallet not connected, show gate
    if (!isConnected && !isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md w-full">
                    <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-6">
                        <Wallet className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
                    <p className="text-slate-400 mb-8">
                        You must connect your wallet to access the AgentOS Dashboard.
                    </p>
                    <div className="scale-110">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <TopBar />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
