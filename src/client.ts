import type { FalahConfig, FalahResponse, Network } from "./types";

const NETWORK_URLS: Record<Network, string> = {
  "mock-net-sandbox": "https://mock.falah-os.com",
  "testnet":          "https://testnet.falah-os.com",
  "mainnet":          "https://api.falah-os.com",
};

export class FalahHttpClient {
  private readonly baseUrl: string;
  private readonly network: Network;
  private readonly timeout: number;
  private readonly debug: boolean;
  private sessionToken?: string;

  constructor(config: FalahConfig = {}) {
    this.network    = config.network  || "mock-net-sandbox";
    this.baseUrl    = config.baseUrl  || NETWORK_URLS[this.network];
    this.timeout    = config.timeout  || 10_000;
    this.debug      = config.debug    || false;
    this.sessionToken = config.sessionToken;
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
  }

  clearSession(): void {
    this.sessionToken = undefined;
  }

  private buildHeaders(): HeadersInit {
    const h: HeadersInit = {
      "Content-Type":    "application/json",
      "X-Falah-SDK":     "ts/1.2.0",
      "X-Falah-Network": this.network,
    };
    if (this.sessionToken) {
      h["X-Session-Token"] = this.sessionToken;
    }
    return h;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<FalahResponse<T>> {
    const url = new URL(this.baseUrl + path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    if (this.debug) console.log(`[Falah SDK] GET ${url.toString()}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: this.buildHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = await res.json();
      if (this.debug) console.log(`[Falah SDK] Response (${res.status}):`, json);
      if (!res.ok) throw new FalahError(json.error || json.message || "Request failed", res.status, json);
      return { ...json, network: this.network, timestamp: new Date().toISOString() };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof FalahError) throw err;
      throw new FalahError((err as Error).message, 0);
    }
  }

  async post<T>(path: string, body?: unknown): Promise<FalahResponse<T>> {
    const url = this.baseUrl + path;
    if (this.debug) console.log(`[Falah SDK] POST ${url}`, body);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = await res.json();
      if (this.debug) console.log(`[Falah SDK] Response (${res.status}):`, json);
      if (!res.ok) throw new FalahError(json.error || json.message || "Request failed", res.status, json);
      return { ...json, network: this.network, timestamp: new Date().toISOString() };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof FalahError) throw err;
      throw new FalahError((err as Error).message, 0);
    }
  }
}

export class FalahError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name        = "FalahError";
    this.statusCode  = statusCode;
    this.details     = details;
  }

  /** HTTP 403 — sovereignty violation (password attempt, etc.) */
  get isSovereigntyViolation(): boolean { return this.statusCode === 403; }

  /** HTTP 422 — Shariah compliance failure */
  get isShariahViolation(): boolean { return this.statusCode === 422; }

  /** Network timeout or connection failure */
  get isNetworkError(): boolean { return this.statusCode === 0; }
}
