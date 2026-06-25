"use client";

import { useEffect, useState } from "react";
import type { HealthResponse } from "@workshop-pulso/shared";

/**
 * Fetches GET /api/health and shows the result. Proves the same-origin /api/*
 * round trip and that the frontend and backend share the same types.
 */
export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "request failed"),
      );
  }, []);

  return (
    <section
      style={{
        marginTop: "1.5rem",
        fontSize: "0.85rem",
        color: "var(--df-muted)",
        textAlign: "center",
      }}
    >
      <strong>Backend health:</strong>{" "}
      {error ? (
        <span style={{ color: "var(--df-error)" }}>error — {error}</span>
      ) : health ? (
        <span style={{ color: "var(--df-success)" }}>
          {health.status} ({health.network})
        </span>
      ) : (
        <span>checking…</span>
      )}
    </section>
  );
}
