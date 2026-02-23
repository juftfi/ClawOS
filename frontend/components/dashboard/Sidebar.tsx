'use client';

import {
    Home,
    Bot,
    Users,
    CreditCard,
    Database,
    BarChart3,
    Settings,
    Zap,
    Shield,
    FileCode,
    X,
    Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { icon: Home, label: 'Overview', href: '/dashboard' },
    { icon: Bot, label: 'AI Chat', href: '/dashboard/chat' },
    { icon: Users, label: 'Agents', href: '/dashboard/agents' },
    { icon: Zap, label: 'Actions', href: '/dashboard/actions' },
    { icon: FileCode, label: 'Contracts', href: '/dashboard/contracts' },
    { icon: Shield, label: 'Security', href: '/dashboard/security' },
    { icon: CreditCard, label: 'Payments', href: '/dashboard/payments' },
    { icon: Database, label: 'Memory', href: '/dashboard/memory' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
];

const mobileNavItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Bot, label: 'Chat', href: '/dashboard/chat' },
    { icon: Zap, label: 'Actions', href: '/dashboard/actions' },
    { icon: Database, label: 'Memory', href: '/dashboard/memory' },
    { icon: BarChart3, label: 'More', href: '/dashboard/analytics' },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const renderNavItems = (onItemClick?: () => void) => (
        <div className="space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon className="w-[18px] h-[18px]" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <>
            <div className="hidden lg:flex w-64 bg-black/80 border-r border-white/10 flex-col backdrop-blur-xl">
                <div className="p-6 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">ClawOS</h1>
                            <p className="text-xs text-white/50">Web3 AI Platform</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
                    {renderNavItems()}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-3">
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </Link>
                    <div className="px-4 text-[10px] text-white/40 font-mono">
                        <p className="mb-1 opacity-70">Contract Active:</p>
                        <p className="break-all text-white/70">
                            {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...'}
                        </p>
                    </div>
                </div>
            </div>

            {mobileOpen ? (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-black/90 border-r border-white/10 backdrop-blur-xl animate-slide-in-right">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <Link href="/" className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                                    <Terminal className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-base font-bold">ClawOS</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="px-4 py-6">{renderNavItems(onClose)}</nav>
                    </div>
                </div>
            ) : null}

            <div className="lg:hidden mobile-nav">
                <div className="flex items-center justify-around px-2 py-2">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                                    isActive ? 'text-white' : 'text-white/50'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
