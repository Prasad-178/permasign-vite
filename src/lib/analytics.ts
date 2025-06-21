import posthog from 'posthog-js';

export const initAnalytics = () => {
    if (typeof window !== 'undefined' && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
        posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
            capture_pageview: false,
            autocapture: true,
            loaded: (posthog) => {
                if (import.meta.env.MODE === 'development') {
                    posthog.debug();
                }
            }
        });
    }
};

export const analytics = posthog;