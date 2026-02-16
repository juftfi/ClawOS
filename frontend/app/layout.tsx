import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

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
    const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={`${spaceGrotesk.variable} ${outfit.variable} bg-black text-white antialiased`}>
                {plausibleDomain ? (
                    <Script defer data-domain={plausibleDomain} src={plausibleSrc} />
                ) : null}
                <Providers>
                    <AnalyticsTracker />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
