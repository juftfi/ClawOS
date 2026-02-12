import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
        { media: '(prefers-color-scheme: dark)', color: '#060a14' },
    ],
};

export const metadata: Metadata = {
    title: "AgentOS | Autonomous AI Agents on Chain",
    description: "AI agents that think, pay, and remember on-chain. Built on BNB Smart Chain with ChainGPT, Q402, and Unibase.",
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'AgentOS',
    },
    openGraph: {
        title: 'AgentOS | Autonomous AI Agents on Chain',
        description: 'AI agents that think, pay, and remember on-chain',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
