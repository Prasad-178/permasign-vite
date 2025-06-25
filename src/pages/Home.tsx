/* eslint-disable @typescript-eslint/no-unused-vars */
// import { Link } from "react-router-dom";
// import { Button } from "../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
// import { Fingerprint, Lock, History } from "lucide-react";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { SecuritySection } from "../components/landing/SecuritySection";
import { PricingSection } from "../components/landing/PricingSection";
import { GetStartedSection } from "../components/landing/GetStartedSection";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Set the worker source for PDF.js

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate(); // To clear the state after scrolling

    useEffect(() => {
        document.title = "PermaSign";
    }, []);

    useEffect(() => {
        // Check if there's a scrollToId in the location state
        if (location.state?.scrollToId) {
            const { scrollToId } = location.state;
            const targetElement = document.getElementById(scrollToId);

            if (targetElement) {
                // Wait a brief moment for the page to fully render, then scroll
                // This can help if elements are still mounting
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Clear the state to prevent re-scrolling on refresh or if the user navigates back
                    // We replace the current history entry's state with an empty object or null
                    navigate(location.pathname, { replace: true, state: {} });
                }, 100); // 100ms delay, adjust if needed
            } else {
                console.warn(`Target element with ID '${scrollToId}' not found after navigating to homepage.`);
                // Optionally clear state here too if the element is definitely not found
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location, navigate]); // Re-run effect if location or navigate changes

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 w-full">
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
                <SecuritySection />
                <PricingSection />
                <GetStartedSection />
            </main>
        </div>
    );
}
