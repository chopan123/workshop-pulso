import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/privy-provider";

export const metadata: Metadata = {
  title: "Workshop Pulso",
  description: "Stellar wallet + DeFindex — Pulso Hackathon workshop",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "3rem 1.5rem",
          maxWidth: 640,
          marginInline: "auto",
          lineHeight: 1.5,
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
