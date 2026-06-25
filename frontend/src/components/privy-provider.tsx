"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

/**
 * Wraps the app in Privy's React provider so any component can use the Privy
 * hooks (login, user, wallets).
 *
 * - Login is restricted to email to keep the workshop focused.
 * - Only `NEXT_PUBLIC_PRIVY_APP_ID` is used here; it's safe to expose. The app
 *   secret stays server-side in the functions.
 *
 * The Stellar embedded wallet is created explicitly after login (see
 * WalletPanel) because Stellar is an "extended chain" — unlike Ethereum, it
 * can't be auto-created via provider config.
 */
export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Without an app ID the provider can't initialise. Render children plainly so
  // the page still loads and the panel can show a setup hint.
  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: { theme: "light" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
