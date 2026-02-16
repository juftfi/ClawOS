'use client';

import { Menu } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

interface TopBarProps {
    onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
    const pathname = usePathname();
    const pageTitle = pathname.split('/').pop() || 'Dashboard';
    const displayTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

    return (
        <div className="h-14 md:h-16 bg-black/70 border-b border-white/10 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl safe-top">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-sm md:text-base font-semibold text-white">
                    {displayTitle === 'Dashboard' ? 'Overview' : displayTitle}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                    <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
                </div>
                <div className="sm:hidden">
                    <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="none" />
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
}
