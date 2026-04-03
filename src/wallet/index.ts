// ─────────────────────────────────────────────────────────────────────────────
// falah.wallet.*
//
// The Value Fabric. Every wallet is bound to an Ummah ID.
// Think of it as a safe — you own the key, we hold nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { FalahHttpClient } from "../client";
import type { WalletBalance, Transaction, TransferInput, FalahResponse } from "../types";

export class WalletModule {
  constructor(private readonly http: FalahHttpClient) {}

  /**
   * Get wallet balance and transaction overview.
   *
   * @example
   * const { data } = await falah.wallet.balance("FLH-XXXX-XXXX");
   * console.log(data.balance, data.currency); // 4289.51 FLH
   * if (data.zakat_threshold_met) {
   *   console.log("Zakat due:", data.zakat_due);
   * }
   */
  async balance(walletId: string): Promise<FalahResponse<WalletBalance>> {
    return this.http.get<WalletBalance>("/api/wallet/dashboard", { wallet_id: walletId });
  }

  /**
   * Transfer FLH between wallets.
   * All transfers are Shariah-audited by RAMZ before execution.
   * A 1.5% protocol fee applies. Net amount = amount × 0.985.
   *
   * @example
   * const tx = await falah.wallet.transfer({
   *   fromWallet: "FLH-SENDER-001",
   *   toWallet:   "FLH-MERCHANT-002",
   *   amount:     "100.00",
   *   note:       "Payment for Nasi Lemak",
   * });
   * console.log(tx.data.transaction_id); // TXN-XXXXXXXX
   */
  async transfer(input: TransferInput): Promise<FalahResponse<Transaction>> {
    return this.http.post<Transaction>("/api/wallet/transfer", {
      from_wallet: input.fromWallet,
      to_wallet:   input.toWallet,
      amount:      String(input.amount),
      currency:    input.currency || "FLH",
      note:        input.note || "",
    });
  }

  /**
   * Get transaction history for a wallet.
   *
   * @example
   * const { data } = await falah.wallet.transactions("FLH-XXXX-XXXX");
   * data.transactions.forEach(tx => console.log(tx.type, tx.amount));
   */
  async transactions(walletId: string): Promise<FalahResponse<{ transactions: Transaction[] }>> {
    return this.http.get<{ transactions: Transaction[] }>(
      "/api/wallet/dashboard",
      { wallet_id: walletId }
    );
  }

  /**
   * Check if a wallet has met the Zakat threshold (nisab).
   * Uses silver nisab (595g) — the more conservative calculation.
   *
   * @example
   * const due = await falah.wallet.zakatStatus("FLH-XXXX-XXXX");
   * if (due.data.threshold_met) {
   *   await falah.contracts.zakat({ walletId: "FLH-XXXX-XXXX", assets: {...} });
   * }
   */
  async zakatStatus(walletId: string): Promise<FalahResponse<{
    wallet_id: string;
    balance: string;
    zakat_due: string;
    threshold_met: boolean;
  }>> {
    const res = await this.balance(walletId);
    return {
      ...res,
      data: res.data ? {
        wallet_id:     res.data.wallet_id,
        balance:       res.data.balance,
        zakat_due:     res.data.zakat_due,
        threshold_met: res.data.zakat_threshold_met,
      } : undefined
    } as FalahResponse<{ wallet_id: string; balance: string; zakat_due: string; threshold_met: boolean }>;
  }
}
