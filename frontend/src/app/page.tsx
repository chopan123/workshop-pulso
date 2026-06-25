import { HealthStatus } from "@/components/health-status";
import { WalletPanel } from "@/components/wallet-panel";
import { VaultPanel } from "@/components/vault-panel";

export default function HomePage() {
  return (
    <>
      <section style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2.1rem" }}>Workshop Pulso</h1>
        <p style={{ fontSize: "1.05rem", color: "var(--df-text)" }}>
          A self-custodial Stellar wallet you control with just an email. Sign in
          with <strong>Privy</strong> to get an embedded <strong>Stellar</strong>{" "}
          wallet, fund it on testnet, and send a payment — then put idle funds to
          work in <strong>DeFindex</strong> yield vaults.
        </p>

        <ol
          className="df-card"
          style={{
            display: "grid",
            gap: "0.4rem",
            margin: "1rem 0 0",
            paddingLeft: "2.4rem",
            fontSize: "0.95rem",
          }}
        >
          <li>
            <strong>Sign in</strong> with your email — no seed phrase, no
            extension.
          </li>
          <li>
            <strong>Fund</strong> your wallet with free testnet XLM.
          </li>
          <li>
            <strong>Send</strong> a payment to any Stellar address.
          </li>
          <li>
            <strong>Earn</strong> by depositing idle XLM into a DeFindex vault.
          </li>
        </ol>
      </section>

      <WalletPanel />
      <VaultPanel />
      <HealthStatus />
    </>
  );
}
