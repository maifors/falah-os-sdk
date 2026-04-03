// ─────────────────────────────────────────────────────────────────────────────
// falah.identity.*
//
// The Identity Fabric. Think of it as a combination lock where YOU are the
// combination — biometric + gesture + device key. The lock never knows what
// the combination is; it only confirms you opened it.
// ─────────────────────────────────────────────────────────────────────────────

import { FalahHttpClient } from "../client";
import type {
  UmmahIdCredentials, UmmahId, AuthChallenge, AuthSession, FalahResponse
} from "../types";

export class IdentityModule {
  constructor(private readonly http: FalahHttpClient) {}

  /**
   * Register a new sovereign identity.
   *
   * Zero PII stored. No password accepted — any attempt will throw a
   * FalahError with isSovereigntyViolation === true.
   *
   * @example
   * const id = await falah.identity.register({
   *   deviceFingerprint:     await device.getFingerprint(),
   *   biometricCommitment:   await biometric.getCommitment(),
   *   sovereignGestureHash:  await gesture.getHash(),
   *   jurisdiction:          "MY",
   * });
   * console.log(id.data.ummah_id); // UID-XXXX-XXXX-XXXX
   */
  async register(credentials: UmmahIdCredentials): Promise<FalahResponse<UmmahId>> {
    return this.http.post<UmmahId>("/api/ummahid/register", {
      device_fingerprint:    credentials.deviceFingerprint,
      biometric_commitment:  credentials.biometricCommitment,
      sovereign_gesture_hash: credentials.sovereignGestureHash,
      jurisdiction:          credentials.jurisdiction,
      mydigitalid_token:     credentials.myDigitalIdToken,
      recovery_commitment:   credentials.recoveryCommitment,
    });
  }

  /**
   * Request an authentication challenge nonce.
   * Challenge expires in 120 seconds.
   *
   * @example
   * const { data } = await falah.identity.challenge("UID-XXXX-XXXX-XXXX");
   * const signedNonce = await device.sign(data.nonce);
   */
  async challenge(ummahId: string): Promise<FalahResponse<AuthChallenge>> {
    return this.http.get<AuthChallenge>("/api/ummahid/challenge", { ummah_id: ummahId });
  }

  /**
   * Authenticate with a ZK proof.
   * Passwordless by design — HTTP 403 on any password field.
   *
   * @example
   * const session = await falah.identity.authenticate({
   *   ummahId:              "UID-XXXX-XXXX-XXXX",
   *   challengeResponse:    signedNonce,
   *   biometricCommitment:  await biometric.getCommitment(),
   *   gestureProof:         await gesture.getProof(),
   * });
   * falah.setSession(session.data.session.token);
   */
  async authenticate(params: {
    ummahId: string;
    challengeResponse: string;
    biometricCommitment: string;
    gestureProof?: string;
    authMethod?: "biometric_gesture" | "gesture_only" | "mydigitalid";
  }): Promise<FalahResponse<AuthSession>> {
    return this.http.post<AuthSession>("/api/ummahid/auth", {
      ummah_id:             params.ummahId,
      challenge_response:   params.challengeResponse,
      biometric_commitment: params.biometricCommitment,
      gesture_proof:        params.gestureProof,
      auth_method:          params.authMethod || "biometric_gesture",
    });
  }

  /**
   * Verify an active session token.
   */
  async verifySession(token?: string): Promise<FalahResponse<{ valid: boolean; ummah_id?: string }>> {
    return this.http.get<{ valid: boolean; ummah_id?: string }>("/api/ummahid/verify");
  }

  /**
   * Get public profile (zero PII — no name, no IC, no email).
   */
  async profile(ummahId: string): Promise<FalahResponse<{
    ummah_id: string;
    assurance_tier: string;
    reputation_score: number;
    contracts_executed: number;
  }>> {
    return this.http.get("/api/ummahid/profile", { ummah_id: ummahId });
  }

  /**
   * Revoke a sovereign identity.
   * Requires a valid ZK proof — only the identity holder can revoke.
   */
  async revoke(ummahId: string, zkProof: string, reason?: string): Promise<FalahResponse<unknown>> {
    return this.http.post("/api/ummahid/revoke", {
      ummah_id: ummahId,
      zk_proof: zkProof,
      reason,
    });
  }
}
