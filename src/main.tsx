import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { ArweaveWalletKit } from "@arweave-wallet-kit/react";
import { WAuthProviders } from "@wauth/strategy";
import { initAnalytics } from "./lib/analytics";
import { PostHogProvider } from "posthog-js/react";
import posthog from 'posthog-js';
import { getStrategy } from './lib/wauthStrategies'
import type { Strategy } from '@arweave-wallet-kit/core/strategy'

initAnalytics();

const strategies = [
  getStrategy(WAuthProviders.Google),
]

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
        strategies: strategies as Strategy[],
      }}
    >
      <App />
    </ArweaveWalletKit>
    </PostHogProvider>
  </React.StrictMode>
);