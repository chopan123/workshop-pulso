import { HealthStatus } from "@/components/health-status";

export default function HomePage() {
  return (
    <main>
      <h1>Workshop Pulso</h1>
      <p>
        A Stellar wallet powered by Privy, with DeFindex vaults. This is the
        Stage&nbsp;0 scaffold — the wallet and vault features come next.
      </p>
      <HealthStatus />
    </main>
  );
}
