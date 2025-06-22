import { HashRouter, useRoutes, Outlet, useLocation } from "react-router-dom";
import routes from "./routes";
import Navbar from "./components/Navbar";
import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
// import AppFooter from "./components/AppFooter";

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
  return (
    <HashRouter>
      <Navbar />
      <div className="pt-16">
        <PostHogPageviewTracker />
        <AppRoutes />
      </div>
      {/* <AppFooter /> */}
    </HashRouter>
  );
}
