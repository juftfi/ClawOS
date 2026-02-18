'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import {
    bscTestnet,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth-context';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
    appName: 'AgentOS Web3',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Replace with valid ID for production
    chains: [bscTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    initialChain={bscTestnet}
                    theme={darkTheme({
                        accentColor: '#9333ea', // Purple-600
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                >
                    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </NextThemesProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
