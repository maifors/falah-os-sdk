// ─────────────────────────────────────────────────────────────────────────────
// @falah/sdk — Core Types
// The type contract for the entire Falah OS platform.
// ─────────────────────────────────────────────────────────────────────────────

export type Network = "mock-net-sandbox" | "mainnet" | "testnet";
export type Currency = "FLH" | "MYR" | "USD" | "AED" | "SAR";
export type Jurisdiction = "MY" | "SG" | "GB" | "AE" | "SA" | "ID" | "BD" | "PK" | string;
export type AssuranceTier = "basic" | "standard" | "sovereign";
export type ContractType = "qard" | "mudarabah" | "musharakah" | "murabahah" | "ijarah" | "zakat" | "wakala" | "istisna";

export interface FalahConfig {
  /** Target network. Defaults to mock-net-sandbox. */
  network?: Network;
  /** Your Falah OS API base URL. Defaults to the network endpoint. */
  baseUrl?: string;
  /** Session token from a successful Ummah ID authentication. */
  sessionToken?: string;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeout?: number;
  /** Enable verbose debug logging. */
  debug?: boolean;
}

export interface FalahResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  network: Network;
  timestamp: string;
}

export interface ZKProof {
  proof: string;
  timestamp: string;
  method: string;
  pii_revealed: false;
}

// ─── Identity ────────────────────────────────────────────────────────────────

export interface UmmahIdCredentials {
  /** Cryptographic fingerprint of the device. Generated locally. Never transmitted raw. */
  deviceFingerprint: string;
  /** Hash of the biometric template. The biometric itself never leaves the device. */
  biometricCommitment: string;
  /** Hash of the user's sovereign gesture pattern. */
  sovereignGestureHash: string;
  /** User's jurisdiction code. */
  jurisdiction: Jurisdiction;
  /** Optional: MyDigitalID token for Sovereign tier (Malaysia). */
  myDigitalIdToken?: string;
  /** Optional: Hash for account recovery. */
  recoveryCommitment?: string;
}

export interface UmmahId {
  ummah_id: string;
  assurance_tier: AssuranceTier;
  jurisdiction: Jurisdiction;
  status: "active" | "revoked" | "suspended";
  created_at: string;
  credentials: {
    key_commitment: string;
    zk_proof: string;
    pii_stored: false;
    password_stored: false;
  };
  wallet_provisioned?: {
    wallet_id: string;
    initial_balance: string;
    currency: Currency;
  };
}

export interface AuthChallenge {
  nonce: string;
  ummah_id: string;
  expires_at: string;
  instructions: string;
}

export interface AuthSession {
  ummah_id: string;
  session: {
    token: string;
    expires_at: string;
    duration_hours: number;
  };
  permissions: Record<string, string[]>;
  zk_verification: ZKProof;
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface WalletBalance {
  wallet_id: string;
  ummah_id: string;
  balance: string;
  currency: Currency;
  zakat_due: string;
  zakat_threshold_met: boolean;
  network: Network;
}

export interface Transaction {
  transaction_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: string;
  currency: Currency;
  fee: string;
  net_amount: string;
  status: "confirmed" | "pending" | "failed";
  shariah_compliant: boolean;
  ramz_audit: string;
  timestamp: string;
}

export interface TransferInput {
  fromWallet: string;
  toWallet: string;
  amount: string | number;
  currency?: Currency;
  note?: string;
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export interface QardInput {
  amount: string | number;
  currency?: Currency;
  lenderWallet: string;
  borrowerWallet: string;
  repaymentDate: string;
  purpose?: string;
}

export interface MudarabahInput {
  capital: string | number;
  currency?: Currency;
  investorWallet: string;
  managerWallet: string;
  profitRatioInvestor: number;
  businessActivity: string;
  durationDays: number;
  description?: string;
}

export interface ZakatInput {
  walletId: string;
  currency?: Currency;
  hawlStart?: string;
  assets: {
    cashSavings?: string | number;
    goldValue?: string | number;
    silverValue?: string | number;
    investments?: string | number;
    businessInventory?: string | number;
    receivables?: string | number;
    debts?: string | number;
  };
}

export interface ShariahAuditInput {
  type?: string;
  amount?: string | number;
  interestRate?: number;
  assetBacked?: boolean;
  mutualConsent?: boolean;
  commodity?: string;
  purpose?: string;
  businessActivity?: string;
  [key: string]: unknown;
}

export interface ShariahAudit {
  verdict: {
    shariah_compliant: boolean;
    score: string;
    rules_passed: number;
    rules_total: number;
    status: "APPROVED" | "REJECTED";
  };
  audit_results: Array<{ rule: string; passed: boolean; violation?: string }>;
  violations: string[];
  ramz_proof: ZKProof & { zk_proof: string };
}

// ─── Mock-Net ─────────────────────────────────────────────────────────────────

export type SimulationScenario = "qard" | "mudarabah" | "zakat" | "merchant" | "istore";

export interface SimulationResult {
  simulation: {
    scenario: SimulationScenario;
    network: Network;
    total_latency_ms: number;
    steps_completed: number;
    all_shariah_compliant: boolean;
  };
  steps: Array<{
    step: number;
    service: string;
    endpoint: string;
    status: string;
    latency_ms: number;
    result: unknown;
  }>;
  summary: {
    identities_created: number;
    transactions_executed: number;
    total_value_moved: string;
    pii_exposed: 0;
    passwords_used: 0;
  };
}
