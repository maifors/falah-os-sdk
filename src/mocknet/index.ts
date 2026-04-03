import { FalahHttpClient } from "../client";
import type { SimulationScenario, SimulationResult, FalahResponse } from "../types";

export class MockNetModule {
  constructor(private readonly http: FalahHttpClient) {}

  /**
   * Run a full end-to-end simulation across all Falah OS services.
   * 8 steps: Identity → Wallet → RAMZ audit → Contract → Transfer → Events → Admin
   *
   * @example
   * const sim = await falah.mocknet.simulate("qard");
   * console.log(`${sim.data.simulation.steps_completed} services in ${sim.data.simulation.total_latency_ms}ms`);
   */
  async simulate(scenario: SimulationScenario = "qard"): Promise<FalahResponse<SimulationResult>> {
    return this.http.post<SimulationResult>("/api/mocknet/simulate", { scenario });
  }

  /**
   * Get live status of all Falah OS services.
   */
  async status(): Promise<FalahResponse<{
    network: { status: string };
    stats: { services_online: number; total_api_endpoints: number; avg_latency_ms: number };
    services: Array<{ name: string; url: string; status: string; latency_ms: number }>;
  }>> {
    return this.http.get("/api/mocknet/status");
  }

  /**
   * Generate synthetic personas for testing.
   *
   * @example
   * const personas = await falah.mocknet.personas({ count: 5, type: "merchant" });
   */
  async personas(opts?: {
    count?: number;
    type?: "citizen" | "merchant" | "developer" | "institution" | "charity";
  }): Promise<FalahResponse<{ personas: unknown[] }>> {
    const params: Record<string, string> = {};
    if (opts?.count) params.count = String(opts.count);
    if (opts?.type)  params.type  = opts.type;
    return this.http.get("/api/mocknet/personas", params);
  }

  /**
   * Time-compress N days of ecosystem activity into a single response.
   * Useful for testing historical data scenarios.
   *
   * @example
   * const history = await falah.mocknet.compress({ days: 90, actors: 10 });
   * console.log(`Simulated ${history.data.compression.events_generated} events`);
   */
  async compress(opts: { days: number; actors?: number }): Promise<FalahResponse<{
    compression: { simulated_days: number; events_generated: number; total_volume: string };
    events: unknown[];
  }>> {
    return this.http.get("/api/mocknet/personas/compress", {
      days:   String(opts.days),
      actors: String(opts.actors || 5),
    });
  }
}
