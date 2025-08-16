import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { ArweaveWalletKit } from "@arweave-wallet-kit/react";
import OthentStrategy from "@arweave-wallet-kit/othent-strategy";
import WAuthStrategy, { WAuthProviders } from "@wauth/strategy";
import { initAnalytics } from "./lib/analytics";
import { PostHogProvider } from "posthog-js/react";
import posthog from 'posthog-js';

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
    <ArweaveWalletKit
      config={{
        permissions: [
          "ACCESS_ADDRESS",
          "SIGN_TRANSACTION",
        ],
        ensurePermissions: true,
        strategies: [
          new OthentStrategy(),
          new WAuthStrategy({
            provider: WAuthProviders.Google,
          })
        ],
      }}
    >
      <App />
    </ArweaveWalletKit>
    </PostHogProvider>
  </React.StrictMode>
);