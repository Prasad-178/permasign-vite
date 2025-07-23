import posthog from 'posthog-js';

export const POSTHOG_KEY = "phc_73VuHm4KblEXeCQ2Sam9fxmCm9KMvL67mMP1vr5iryy";
export const POSTHOG_HOST = "https://us.i.posthog.com";

export const initAnalytics = () => {
    if (typeof window !== 'undefined') {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
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
                // Identify the environment
                posthog.register({
                    environment: 'production',
                    app_version: '1.0.0'
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