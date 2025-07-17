import posthog from 'posthog-js';

export const initAnalytics = () => {
    if (typeof window !== 'undefined' && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
        posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
            person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
            capture_pageview: true, // Enable automatic page view tracking
            autocapture: {
                dom_event_allowlist: ['click', 'change', 'submit'], // Capture specific events
                url_allowlist: [window.location.hostname], // Only capture on your domain
                css_selector_allowlist: ['[data-ph-capture]'] // Only capture elements with this attribute
            },
            capture_performance: true, // Track performance metrics
            session_recording: {
                maskAllInputs: true // Mask all input fields for privacy
            },
            loaded: (posthog) => {
                if (import.meta.env.MODE === 'development') {
                    console.log('PostHog initialized in development mode');
                    posthog.debug(); // Enable debug mode in development
                }
                
                // Identify the environment
                posthog.register({
                    environment: import.meta.env.MODE,
                    app_version: import.meta.env.VITE_APP_VERSION || '1.0.0'
                });
                
                console.log('PostHog analytics initialized successfully');
            }
        });
    } else {
        console.warn('PostHog not initialized: Missing VITE_PUBLIC_POSTHOG_KEY environment variable');
    }
};

// Enhanced analytics helper with common events
export const analytics = {
    // Core posthog instance
    ...posthog,
    
    // Custom tracking methods
    trackPageView: (pageName?: string) => {
        if (posthog.__loaded) {
            posthog.capture('$pageview', {
                page_name: pageName || document.title,
                url: window.location.href,
                referrer: document.referrer
            });
        }
    },
    
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.capture(eventName, {
                ...properties,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent
            });
        }
    },
    
    trackUserAction: (action: string, category: string, properties?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.capture('user_action', {
                action,
                category,
                ...properties
            });
        }
    },
    
    identifyUser: (userId: string, properties?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.identify(userId, properties);
        }
    },
    
    setUserProperties: (properties: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.people.set(properties);
        }
    },
    
    reset: () => {
        if (posthog.__loaded) {
            posthog.reset();
        }
    }
};