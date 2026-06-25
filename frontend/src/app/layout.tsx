import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Familjen_Grotesk, Inter_Tight } from "next/font/google";
import { Providers } from "@/components/privy-provider";
import { SiteHeader } from "@/components/site-header";
import "./theme.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Workshop Pulso",
  description: "Stellar wallet + DeFindex — Pulso Hackathon workshop",
  icons: { icon: "/brand/symbol.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${familjen.variable} ${interTight.variable}`}>
      <body>
        <Providers>
          <div
            style={{
              maxWidth: 680,
              marginInline: "auto",
              padding: "1.5rem 1.25rem 4rem",
            }}
          >
            <SiteHeader />
            <main>{children}</main>
          </div>
          <footer
            style={{
              borderTop: "1px solid var(--df-border)",
              padding: "1rem 1.25rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                maxWidth: 680,
                margin: "0 auto",
                fontSize: "0.8rem",
                color: "var(--df-muted)",
              }}
            >
              ⚠️ Educational demo for the Pulso Hackathon — runs on Stellar
              <strong> testnet</strong>. This is <strong>not</strong> a financial
              service and is not for real funds. Do not send mainnet assets.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
