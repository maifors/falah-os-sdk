// ─────────────────────────────────────────────────────────────────────────────
// @falah/sdk — Main Entry Point
//
// import { Falah } from "@falah/sdk";
//
// const falah = new Falah({ network: "mock-net-sandbox" });
//
// // Register an identity
// const id = await falah.identity.register({ ... });
//
// // Transfer value
// const tx = await falah.wallet.transfer({ ... });
//
// // Execute a Shariah contract
// const contract = await falah.contracts.qard({ ... });
//
// // Audit any transaction
// const audit = await falah.contracts.audit({ ... });
// ─────────────────────────────────────────────────────────────────────────────

import { FalahHttpClient } from "./client";
import { IdentityModule   } from "./identity";
import { WalletModule     } from "./wallet";
import { ContractsModule  } from "./contracts";
import { MockNetModule    } from "./mocknet";
import type { FalahConfig } from "./types";

export class Falah {
  /** Identity Fabric — falah.identity.register(), .authenticate(), .profile() */
  readonly identity: IdentityModule;
  /** Wallet Fabric — falah.wallet.balance(), .transfer(), .zakatStatus() */
  readonly wallet: WalletModule;
  /** Contracts Fabric — falah.contracts.qard(), .mudarabah(), .zakat(), .audit() */
  readonly contracts: ContractsModule;
  /** Mock-Net Sandbox — falah.mocknet.simulate(), .status(), .personas() */
  readonly mocknet: MockNetModule;

  private readonly http: FalahHttpClient;

  constructor(config: FalahConfig = {}) {
    this.http      = new FalahHttpClient(config);
    this.identity  = new IdentityModule(this.http);
    this.wallet    = new WalletModule(this.http);
    this.contracts = new ContractsModule(this.http);
    this.mocknet   = new MockNetModule(this.http);
  }

  /**
   * Set a session token after successful authentication.
   * The token will be sent with all subsequent requests.
   *
   * @example
   * const session = await falah.identity.authenticate({ ... });
   * falah.setSession(session.data.session.token);
   */
  setSession(token: string): this {
    this.http.setSessionToken(token);
    return this;
  }

  /** Clear the current session. */
  clearSession(): this {
    this.http.clearSession();
    return this;
  }
}

// Named exports for tree-shaking
export { FalahHttpClient, FalahError } from "./client";
export { IdentityModule  } from "./identity";
export { WalletModule    } from "./wallet";
export { ContractsModule } from "./contracts";
export { MockNetModule   } from "./mocknet";

// Type exports
export type {
  FalahConfig, FalahResponse, Network, Currency, Jurisdiction,
  AssuranceTier, ContractType, UmmahId, UmmahIdCredentials,
  AuthChallenge, AuthSession, WalletBalance, Transaction,
  TransferInput, QardInput, MudarabahInput, ZakatInput,
  ShariahAuditInput, ShariahAudit, SimulationScenario, SimulationResult,
  ZKProof
} from "./types";

// Default export
export default Falah;
