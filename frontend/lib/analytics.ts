type PlausibleEventProps = Record<string, string | number | boolean>;

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: PlausibleEventProps }) => void;
    }
}

export function trackEvent(event: string, props?: PlausibleEventProps) {
    if (typeof window === "undefined") return;
    if (typeof window.plausible !== "function") return;
    window.plausible(event, props ? { props } : undefined);
}

export function trackPageview() {
    if (typeof window === "undefined") return;
    if (typeof window.plausible !== "function") return;
    window.plausible("pageview");
}
