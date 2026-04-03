// ─────────────────────────────────────────────────────────────────────────────
// falah.contracts.*
//
// The Contracts Fabric — RAMZ-powered Shariah primitives.
// Think of each contract as a pre-signed legal agreement, except the
// "signature" is a ZK proof and the "court" is the RAMZ coprocessor.
// ─────────────────────────────────────────────────────────────────────────────

import { FalahHttpClient } from "../client";
import type {
  QardInput, MudarabahInput, ZakatInput, ShariahAuditInput,
  ShariahAudit, FalahResponse
} from "../types";

export class ContractsModule {
  constructor(private readonly http: FalahHttpClient) {}

  /**
   * Execute a Qard al-Hasan (interest-free benevolent loan) contract.
   *
   * Rules enforced by RAMZ:
   * - interest_rate must be 0%
   * - repayment amount cannot exceed principal
   * - purpose must be halal
   * - late penalties are prohibited
   *
   * @example
   * const contract = await falah.contracts.qard({
   *   amount:        "500",
   *   lenderWallet:  "FLH-LENDER-001",
   *   borrowerWallet:"FLH-BORROWER-002",
   *   repaymentDate: "2026-12-01",
   *   purpose:       "Home repair assistance",
   * });
   */
  async qard(input: QardInput): Promise<FalahResponse<{
    contract: {
      id: string; type: string; status: string;
      terms: { principal: string; interest_rate: string; repayment_date: string };
      ramz_audit: { zk_proof: string; rules_passed: number };
    }
  }>> {
    return this.http.post("/api/ramz/qard", {
      amount:           String(input.amount),
      currency:         input.currency || "FLH",
      lender_wallet:    input.lenderWallet,
      borrower_wallet:  input.borrowerWallet,
      repayment_date:   input.repaymentDate,
      purpose:          input.purpose,
    });
  }

  /**
   * Execute a Mudarabah (profit-sharing) contract.
   *
   * Rules enforced by RAMZ:
   * - profit ratio must be 0–100%
   * - guaranteed_return is prohibited (transforms to riba)
   * - loss borne solely by investor (Rabb al-Mal)
   * - business activity must be halal
   *
   * @example
   * const partnership = await falah.contracts.mudarabah({
   *   capital:          "10000",
   *   investorWallet:   "FLH-INVESTOR-001",
   *   managerWallet:    "FLH-MUDARIB-001",
   *   profitRatioInvestor: 60,   // 60% to investor, 40% to manager
   *   businessActivity: "Halal food distribution",
   *   durationDays:     365,
   * });
   */
  async mudarabah(input: MudarabahInput): Promise<FalahResponse<{
    contract: {
      id: string; type: string; status: string;
      terms: {
        capital: string; profit_sharing: Record<string, string>;
        guaranteed_return: false;
      };
    }
  }>> {
    return this.http.post("/api/ramz/mudarabah", {
      capital:               String(input.capital),
      currency:              input.currency || "FLH",
      investor_wallet:       input.investorWallet,
      manager_wallet:        input.managerWallet,
      profit_ratio_investor: input.profitRatioInvestor,
      business_activity:     input.businessActivity,
      duration_days:         input.durationDays,
      description:           input.description,
    });
  }

  /**
   * Calculate Zakat obligation.
   *
   * Uses silver nisab (595g × live price) — the more conservative standard.
   * Returns 2.5% of net zakatable wealth if nisab and hawl conditions are met.
   *
   * @example
   * const zakat = await falah.contracts.zakat({
   *   walletId:  "FLH-XXXX-XXXX",
   *   hawlStart: "2025-04-01",
   *   assets: {
   *     cashSavings:  "5000",
   *     goldValue:    "8000",
   *     investments:  "12000",
   *     debts:        "2000",
   *   }
   * });
   * console.log(zakat.data.calculation.zakat_obligation.amount); // 575.00
   */
  async zakat(input: ZakatInput): Promise<FalahResponse<{
    calculation: {
      zakat_obligation: { due: boolean; amount: number; rate: string };
      nisab: { met: boolean; threshold: number };
      hawl: { hawl_met: boolean };
      distribution_suggestion: Array<{ category: string; suggested_amount: string }>;
    }
  }>> {
    return this.http.post("/api/ramz/zakat", {
      wallet_id:  input.walletId,
      currency:   input.currency || "FLH",
      hawl_start: input.hawlStart,
      assets: {
        cash_savings:       String(input.assets.cashSavings       || "0"),
        gold_value:         String(input.assets.goldValue         || "0"),
        silver_value:       String(input.assets.silverValue       || "0"),
        investments:        String(input.assets.investments       || "0"),
        business_inventory: String(input.assets.businessInventory || "0"),
        receivables:        String(input.assets.receivables       || "0"),
        debts:              String(input.assets.debts             || "0"),
      },
    });
  }

  /**
   * Run a Shariah compliance audit on any transaction.
   *
   * Checks 7 rules: NO_RIBA, NO_GHARAR, NO_MAYSIR, HALAL_COMMODITY,
   * ASSET_BACKED, MUTUAL_CONSENT, NO_BAI_INAH.
   * Returns a ZK proof of the audit result.
   *
   * @example
   * const audit = await falah.contracts.audit({
   *   type:          "trade",
   *   amount:        "1000",
   *   asset:         "dates",
   *   interest_rate: 0,
   *   asset_backed:  true,
   *   mutual_consent: true,
   * });
   * if (!audit.data.verdict.shariah_compliant) {
   *   console.log("Violations:", audit.data.violations);
   * }
   */
  async audit(transaction: ShariahAuditInput): Promise<FalahResponse<ShariahAudit>> {
    // Normalize camelCase to snake_case for the API
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(transaction)) {
      const snake = k.replace(/([A-Z])/g, c => "_" + c.toLowerCase());
      payload[snake] = v;
    }
    return this.http.post<ShariahAudit>("/api/ramz/audit", payload);
  }

  /**
   * List all available contract templates from the RAMZ registry.
   *
   * @example
   * const { data } = await falah.contracts.templates();
   * const live = data.templates.filter(t => t.status === "live");
   */
  async templates(filters?: { category?: string; status?: "live" | "coming_soon" }): Promise<FalahResponse<{
    total: number;
    live_count: number;
    templates: Array<{
      id: string; name: string; arabic: string; category: string;
      status: string; endpoint: string;
    }>;
  }>> {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.status)   params.status   = filters.status;
    return this.http.get("/api/ramz/templates", params);
  }
}
