import { HealthStatus } from "@/components/health-status";
import { WalletPanel } from "@/components/wallet-panel";

export default function HomePage() {
  return (
    <main>
      <h1>Workshop Pulso</h1>
      <p>
        A Stellar wallet powered by Privy, with DeFindex vaults. Sign in to get
        an embedded Stellar wallet — vault features come next.
      </p>
      <WalletPanel />
      <HealthStatus />
    </main>
  );
}
