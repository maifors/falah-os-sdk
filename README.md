# @falah/sdk

**The official TypeScript SDK for Falah OS™ — sovereign identity, Islamic finance contracts, and digital wallets in one import.**

```bash
npm install @falah/sdk
```

---

## Quick Start

```typescript
import { Falah } from "@falah/sdk";

// Connect to Mock-Net Sandbox (no setup required)
const falah = new Falah({ network: "mock-net-sandbox" });

// 1. Register a sovereign identity
const id = await falah.identity.register({
  deviceFingerprint:    "fp_device_abc123",
  biometricCommitment:  "bio_sha256_xyz789",
  sovereignGestureHash: "gesture_abc789",
  jurisdiction:         "MY",
});
console.log(id.data.ummah_id); // UID-A3F9-D2E8-1B5C

// 2. Check wallet balance
const balance = await falah.wallet.balance(id.data.wallet_provisioned.wallet_id);
console.log(balance.data.balance); // 0.00

// 3. Execute a Shariah contract
const loan = await falah.contracts.qard({
  amount:        "500",
  lenderWallet:  "FLH-LENDER-001",
  borrowerWallet: id.data.wallet_provisioned.wallet_id,
  repaymentDate:  "2026-12-01",
  purpose:       "Home repair assistance",
});
console.log(loan.data.contract.id); // RAMZ-QH-XXXXXXXX

// 4. Audit any transaction for Shariah compliance
const audit = await falah.contracts.audit({
  type:          "trade",
  amount:        1000,
  asset:         "dates",
  interestRate:  0,
  assetBacked:   true,
  mutualConsent: true,
});
console.log(audit.data.verdict.status); // APPROVED
```

---

## Authentication

Falah OS is **passwordless by design**. Any authentication attempt with a `password`, `pin`, or `otp` field will throw a `FalahError` with `isSovereigntyViolation === true`.

```typescript
// Step 1: Get a challenge nonce
const { data: challenge } = await falah.identity.challenge("UID-XXXX-XXXX-XXXX");

// Step 2: Sign with device key + biometric
// (your app's crypto layer handles the actual signing)
const signedNonce = await yourDevice.sign(challenge.nonce);
const bioCommit   = await yourBiometric.getCommitment();

// Step 3: Authenticate — returns a session token
const session = await falah.identity.authenticate({
  ummahId:             "UID-XXXX-XXXX-XXXX",
  challengeResponse:   signedNonce,
  biometricCommitment: bioCommit,
  gestureProof:        await yourGesture.getProof(),
});

// Step 4: Set session — all subsequent calls are authenticated
falah.setSession(session.data.session.token);
```

---

## Contracts

### Qard al-Hasan — Interest-Free Loan
```typescript
const loan = await falah.contracts.qard({
  amount:         "1000",
  lenderWallet:   "FLH-LENDER-001",
  borrowerWallet: "FLH-BORROWER-002",
  repaymentDate:  "2027-01-01",
  purpose:        "Education expenses",
});
// interest_rate: "0%" — enforced by RAMZ, not configurable
```

### Mudarabah — Profit Sharing
```typescript
const partnership = await falah.contracts.mudarabah({
  capital:             "50000",
  investorWallet:      "FLH-INVESTOR-001",
  managerWallet:       "FLH-MUDARIB-001",
  profitRatioInvestor: 60,   // 60% investor, 40% manager
  businessActivity:    "Halal food import/export",
  durationDays:        365,
});
// guaranteed_return: false — always, by design
```

### Zakat Calculator
```typescript
const zakat = await falah.contracts.zakat({
  walletId:  "FLH-XXXX-XXXX",
  hawlStart: "2025-04-01",
  assets: {
    cashSavings:  "5000",
    goldValue:    "8000",
    investments:  "12000",
    debts:        "2000",
  },
});
console.log(`Zakat due: ${zakat.data.calculation.zakat_obligation.amount} FLH`);
// 2.5% of (5000 + 8000 + 12000 - 2000) = 575 FLH
```

---

## Error Handling

```typescript
import { Falah, FalahError } from "@falah/sdk";

try {
  await falah.contracts.qard({ interestRate: 5, /* ... */ } as any);
} catch (err) {
  if (err instanceof FalahError) {
    if (err.isShariahViolation) {
      // HTTP 422 — contract rejected by RAMZ
      console.error("Shariah violation:", err.message);
    }
    if (err.isSovereigntyViolation) {
      // HTTP 403 — password/OTP attempt
      console.error("No passwords allowed.");
    }
    if (err.isNetworkError) {
      // Timeout or connection failure
      console.error("Network error:", err.message);
    }
  }
}
```

---

## Networks

| Network | Value | Description |
|---------|-------|-------------|
| Mock-Net Sandbox | `"mock-net-sandbox"` | Full fidelity, no real value |
| Testnet | `"testnet"` | Pre-mainnet integration testing |
| Mainnet | `"mainnet"` | Production sovereign economy |

```typescript
// Sandbox (default)
const falah = new Falah({ network: "mock-net-sandbox" });

// Production
const falah = new Falah({
  network:      "mainnet",
  sessionToken: "session_from_auth",
});
```

---

## Mock-Net Testing

```typescript
// Run a full end-to-end simulation in one call
const sim = await falah.mocknet.simulate("mudarabah");
console.log(`${sim.data.simulation.steps_completed} services · ${sim.data.simulation.total_latency_ms}ms`);

// Generate synthetic test personas
const personas = await falah.mocknet.personas({ count: 5, type: "merchant" });

// Compress 90 days of activity into one response
const history = await falah.mocknet.compress({ days: 90, actors: 10 });
```

---

## API Reference

| Namespace | Methods |
|-----------|---------|
| `falah.identity` | `.register()` `.challenge()` `.authenticate()` `.verifySession()` `.profile()` `.revoke()` |
| `falah.wallet` | `.balance()` `.transfer()` `.transactions()` `.zakatStatus()` |
| `falah.contracts` | `.qard()` `.mudarabah()` `.zakat()` `.audit()` `.templates()` |
| `falah.mocknet` | `.simulate()` `.status()` `.personas()` `.compress()` |

---

## Links

- **Dev Portal:** [dev.falah-os.com](https://dev.falah-os.com)
- **RAMZ Engine:** [ramz.falah-os.com](https://ramz.falah-os.com)
- **Mock-Net:** [mock.falah-os.com](https://mock.falah-os.com)
- **Ummah ID:** [id.falah-os.com](https://id.falah-os.com)
- **iStore™:** [store.falah-os.com](https://store.falah-os.com)

---

*Falah OS™ © 2026 Falah Consultancy Ltd · Shariah-compliant by design · Zero passwords, zero PII.*
