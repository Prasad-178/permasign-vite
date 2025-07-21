import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { SecuritySection } from "../components/landing/SecuritySection";
import { PricingSection } from "../components/landing/PricingSection";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppFooter from "../components/AppFooter";
import { StatisticsTab } from "../components/landing/StatisticsTab";

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "PermaSign | Secure, Permanent Document Signing on Arweave";
    }, []);

    useEffect(() => {
        if (location.state?.scrollToId) {
            const { scrollToId } = location.state;
            const targetElement = document.getElementById(scrollToId);

            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    navigate(location.pathname, { replace: true, state: {} });
                }, 100);
            } else {
                console.warn(`Target element with ID '${scrollToId}' not found after navigating to homepage.`);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location, navigate]);

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 w-full">
                <HeroSection />
                <FeaturesSection />
                <StatisticsTab />
                <HowItWorksSection />
                <SecuritySection />
                <PricingSection />
            </main>
            <AppFooter />
        </div>
    );
}
