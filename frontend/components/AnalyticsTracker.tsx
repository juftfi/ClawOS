'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageview } from '@/lib/analytics';

export function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        trackPageview();
    }, [pathname]);

    return null;
}
