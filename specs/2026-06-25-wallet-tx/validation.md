# Validation — Stage 1: Balance, Fund & Send (P1.5–P1.7)

## Automated

- Typecheck passes across the workspace (shared, functions, frontend) — the new
  shared types and `STELLAR_NETWORKS` map resolve on both sides.
- `friendbotUrl` for testnet equals exactly `"https://friendbot.stellar.org"` in
  `STELLAR_NETWORKS`, and mainnet `friendbotUrl` is `null`.
- Lint/format pass with the project's existing config.
- Any added unit test for `PaymentRequest` validation (valid `G…` address +
  positive amount accepted; bad address, empty/negative/non-numeric amount
  rejected) passes.

## Manual (run `netlify dev`, sign in with email OTP)

1. **Balance (P1.5).** After login the panel shows an XLM balance for the
   server-provisioned address. A brand-new (unfunded) account shows `0` or a
   clear "unfunded" state rather than an error.
2. **Fund (P1.6).** Click "Fund on testnet" → Friendbot funds the address →
   balance refreshes to ~10000 XLM. Clicking again on an already-funded account
   shows a clear, non-fatal message. Button is hidden/disabled when the network
   is mainnet.
3. **Send (P1.7).** Enter a second testnet address + an amount → submit. The
   browser signs (Privy `signRawHash` on the user's wallet) and the tx hash is
   shown; the sender balance drops by amount + fee. Verify the hash on a testnet
   explorer. The server never produces the signature.
4. **Validation.** `prepare` with an invalid destination or a non-positive /
   empty amount returns `400` with a readable inline message; nothing is built or
   broadcast. `submit` with a missing XDR/signature returns `400`.
4b. **Explanatory errors.** Sending more than the balance shows the Horizon cause
   (e.g. `tx_insufficient_balance`) from `submit` in the error line, not a generic
   message. Preparing from an unfunded wallet says to fund it on testnet first.
4d. **New destination.** Sending to a brand-new (uncreated) address succeeds via
   `createAccount` and creates the account with the sent amount. Sending below the
   ~1 XLM base reserve to a new address surfaces `op_low_reserve`.
4c. **Tamper resistance.** A `submit` whose XDR was altered after signing, or
   signed by a different key, is rejected by Horizon (`tx_bad_auth`) — the bound
   signature hint comes from the server-resolved address.
5. **Auth guard.** Calling balance / fund / prepare / submit without a Bearer
   token returns `401`.

## Tone check

- Button and form copy is plain and instructional ("Fund on testnet", "Send
  XLM", destination/amount labels) — consistent with the existing wallet panel.
- Error messages are human-readable, not raw upstream errors.

## Definition of done

- `GET /api/wallet/balance`, `POST /api/wallet/fund`,
  `POST /api/payments/prepare`, and `POST /api/payments/submit` exist, are
  auth-guarded, and are wired in `netlify.toml` ahead of the `/api/*` catch-all.
- Balance reads + tx submission go through Horizon; Friendbot funds; **signing
  happens only in the user's browser** — the server never signs.
- The wallet panel shows balance, funds on testnet, and sends a native XLM
  payment end-to-end against testnet.
- P1.5–P1.7 checked off in `specs/roadmap.md`.
- If `@stellar/stellar-sdk` was needed for payment XDR, it was approved before
  being added.
