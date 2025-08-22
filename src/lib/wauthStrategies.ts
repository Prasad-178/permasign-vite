// lib/strategy.ts
import WAuthStrategy, { WAuthProviders } from "@wauth/strategy";

const strategies: { [key: string]: WAuthStrategy } = {
    [WAuthProviders.Google]: new WAuthStrategy({ provider: WAuthProviders.Google }),
}

export function getStrategy(provider: WAuthProviders): WAuthStrategy {
    return strategies[provider]
}

// Optional: Helper to get active provider
export function getActiveWAuthProvider(): WAuthProviders | null {
    let provider = localStorage.getItem("wallet_kit_strategy_id")
    if (!provider || !provider.startsWith("wauth")) return null
    
    provider = provider.split("-")[1]
    switch (provider) {
        case WAuthProviders.Google: return WAuthProviders.Google
        case WAuthProviders.Github: return WAuthProviders.Github
        case WAuthProviders.Discord: return WAuthProviders.Discord
        default: return null
    }
}