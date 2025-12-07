'use client';

import { Bell, Menu } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from './ThemeToggle';
import { NetworkToggle } from '../NetworkToggle';
import { usePathname } from 'next/navigation';

export function TopBar() {
    const pathname = usePathname();
    const pageTitle = pathname.split('/').pop() || 'Dashboard';
    const displayTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

    return (
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
            {/* Left: Page Title / Mobile Menu */}
            <div className="flex items-center gap-4">
                <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Menu className="w-6 h-6 text-slate-600 dark:text-white" />
                </button>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white hidden md:block">
                    {displayTitle === 'Dashboard' ? 'Overview' : displayTitle}
                </h2>
            </div>

            {/* Right: Network, Wallet, Notifications, Theme */}
            <div className="flex items-center gap-3">
                {/* Network Toggle */}
                <div className="hidden md:block">
                    <NetworkToggle />
                </div>

                {/* Wallet Connect */}
                <div className="hidden md:block">
                    <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
                </div>

                <ThemeToggle />

                {/* Notifications */}
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                </button>
            </div>
        </div>
    );
}
