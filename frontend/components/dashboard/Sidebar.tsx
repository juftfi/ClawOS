'use client';

import { Home, Bot, Users, CreditCard, Database, BarChart3, Settings, Zap, Shield, FileCode, X, Terminal } from 'lucide-react';
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

// Mobile bottom nav - only show 5 most important
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

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:flex w-60 glass flex-col transition-all duration-300">
                {/* Logo */}
                <div className="p-5 border-b border-slate-200 dark:border-white/5">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-slate-900 dark:text-white">AgentOS</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
                    <div className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                        ${isActive
                                            ? 'bg-neon-cyan/10 text-neon-cyan dark:text-neon-cyan'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-neon-cyan' : ''}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Settings */}
                <div className="p-3 border-t border-slate-200 dark:border-white/5">
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        <Settings className="w-[18px] h-[18px]" />
                        <span>Settings</span>
                    </Link>
                </div>
            </div>

            {/* Mobile drawer overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="absolute left-0 top-0 bottom-0 w-72 glass-strong animate-slide-in-right">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <Link href="/" className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                                    <Terminal className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-base font-bold">AgentOS</span>
                            </Link>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="px-3 py-4">
                            <div className="space-y-0.5">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                                                flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                                                ${isActive
                                                    ? 'bg-neon-cyan/10 text-neon-cyan'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-neon-cyan' : ''}`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>
                </div>
            )}

            {/* Mobile bottom nav */}
            <div className="lg:hidden mobile-nav">
                <div className="flex items-center justify-around px-2 py-1.5">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                                    isActive ? 'text-neon-cyan' : 'text-slate-500'
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
