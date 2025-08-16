import { HashRouter, useRoutes, useLocation } from "react-router-dom";
import routes from "./routes";
import Navbar from "./components/Navbar";
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { X } from "lucide-react";
import { fixConnection } from "@wauth/strategy";
import { useActiveAddress, useConnection } from "@arweave-wallet-kit/react";

function AppRoutes() {
  return useRoutes(routes);
}

function PostHogPageviewTracker() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview');
    }
  }, [location, posthog]);

  return null;
}

export default function App() {
  const [showBetaBanner, setShowBetaBanner] = useState(false);
  const { connected, disconnect } = useConnection();
  const address = useActiveAddress();

  useEffect(() => {
    const hasDismissedBetaBanner = localStorage.getItem('dismissedBetaBanner');
    if (!hasDismissedBetaBanner) {
        setShowBetaBanner(true);
    }
  }, []);

  useEffect(() => {
    if (address && connected) {
      fixConnection(address, connected, disconnect);
    }
  }, [address, connected, disconnect]);

  const handleDismissBetaBanner = () => {
      setShowBetaBanner(false);
      localStorage.setItem('dismissedBetaBanner', 'true');
  };

  return (
    <HashRouter>
      {showBetaBanner && (
          <div className="relative bg-yellow-100 text-yellow-800 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
              <span>
                  PermaSign is currently in Beta. You might encounter bugs. Please report any issues via
                  <a href="mailto:ar.perma.sign@gmail.com" className="underline ml-1">email</a>.
              </span>
              <button
                  onClick={handleDismissBetaBanner}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  aria-label="Dismiss beta banner"
              >
                  <X className="h-4 w-4" />
              </button>
          </div>
      )}
      <Navbar />
      <div className="pt-16">
        <PostHogPageviewTracker />
        <AppRoutes />
      </div>
    </HashRouter>
  );
}