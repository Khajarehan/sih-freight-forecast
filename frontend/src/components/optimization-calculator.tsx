"use client";

import { useEffect, useState } from "react";
import {
  fetchRoutes,
  OptimizationRequest,
  OptimizationResponse,
  Route,
  runOptimization,
} from "@/lib/api";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Package,
  Scale,
  Settings,
  Ship,
  XCircle,
} from "lucide-react";

export default function OptimizationCalculator() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [cargoQuantity, setCargoQuantity] = useState<number>(65000);

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() + 1);
  const defaultEnd = new Date(today);
  defaultEnd.setDate(today.getDate() + 7);

  const [laycanStart, setLaycanStart] = useState<string>(defaultStart.toISOString().split("T")[0]);
  const [laycanEnd, setLaycanEnd] = useState<string>(defaultEnd.toISOString().split("T")[0]);

  const [includeCapesize, setIncludeCapesize] = useState(true);
  const [includePanamax, setIncludePanamax] = useState(true);
  const [includeSupramax, setIncludeSupramax] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResponse | null>(null);

  useEffect(() => {
    async function loadRoutes() {
      try {
        const data = await fetchRoutes();
        setRoutes(data);
        if (data.length > 0) {
          setSelectedRouteId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load routes:", err);
      }
    }
    loadRoutes();
  }, []);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const candidateIds: number[] = [];
    if (includeCapesize) candidateIds.push(1);
    if (includePanamax) candidateIds.push(2);
    if (includeSupramax) candidateIds.push(3);

    const request: OptimizationRequest = {
      route_id: selectedRouteId,
      cargo_quantity_t: cargoQuantity,
      laycan_start: laycanStart,
      laycan_end: laycanEnd,
      candidate_vessel_type_ids: candidateIds.length > 0 ? candidateIds : undefined,
    };

    try {
      const response = await runOptimization(request);
      setResult(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Optimization execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="op-section p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#17211F] tracking-tight">
              Chartering Decision Support & Cost Optimizer
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#F0F2EF] text-[#176B63] text-[11px] font-medium border border-[#D9DFDB]">
              OR-Tools CP-SAT
            </span>
          </div>
          <p className="text-xs text-[#5E6965] mt-1">
            Compute minimum-cost vessel allocation and optimal laycan date subject to physical port draft, LOA, and beam constraints.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs font-mono text-[#17211F]">
          <Scale className="w-4 h-4 text-[#176B63]" />
          <span>Integer Programming Solver v7.0</span>
        </div>
      </div>

      {/* Two-Stage Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT STAGE: Parameters Form Panel */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleOptimize} className="op-section p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#17211F] border-b border-[#D9DFDB] pb-3 font-mono">
              <Settings className="w-4 h-4 text-[#176B63]" />
              <span>Voyage Parameters</span>
            </div>

            {/* Route Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#17211F]">Shipping Trade Route</label>
              <select
                value={selectedRouteId ?? ""}
                onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] focus:outline-none focus:border-[#176B63]"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.origin_port.name} ({rt.origin_port.unlocode}) → {rt.destination_port.name} ({rt.destination_port.unlocode}) [{rt.distance_nm} NM]
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#17211F] flex justify-between">
                <span>Cargo Volume (Tonnes)</span>
                <span className="text-[11px] text-[#5E6965] font-mono">Metric Tonnes</span>
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-[#5E6965] absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1000"
                  max="250000"
                  step="1000"
                  value={cargoQuantity}
                  onChange={(e) => setCargoQuantity(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] font-mono focus:outline-none focus:border-[#176B63]"
                  required
                />
              </div>
            </div>

            {/* Laycan Window Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#17211F]">Laycan Start</label>
                <input
                  type="date"
                  value={laycanStart}
                  onChange={(e) => setLaycanStart(e.target.value)}
                  className="w-full px-2.5 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] font-mono focus:outline-none focus:border-[#176B63]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#17211F]">Laycan End</label>
                <input
                  type="date"
                  value={laycanEnd}
                  onChange={(e) => setLaycanEnd(e.target.value)}
                  className="w-full px-2.5 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] font-mono focus:outline-none focus:border-[#176B63]"
                  required
                />
              </div>
            </div>

            {/* Candidate Vessel Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#17211F]">Candidate Vessel Classes</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs cursor-pointer hover:border-[#176B63]">
                  <input
                    type="checkbox"
                    checked={includeCapesize}
                    onChange={(e) => setIncludeCapesize(e.target.checked)}
                    className="rounded text-[#176B63] focus:ring-0"
                  />
                  <span className="text-[#17211F] text-[11px]">Capesize</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs cursor-pointer hover:border-[#176B63]">
                  <input
                    type="checkbox"
                    checked={includePanamax}
                    onChange={(e) => setIncludePanamax(e.target.checked)}
                    className="rounded text-[#176B63] focus:ring-0"
                  />
                  <span className="text-[#17211F] text-[11px]">Panamax</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs cursor-pointer hover:border-[#176B63]">
                  <input
                    type="checkbox"
                    checked={includeSupramax}
                    onChange={(e) => setIncludeSupramax(e.target.checked)}
                    className="rounded text-[#176B63] focus:ring-0"
                  />
                  <span className="text-[#17211F] text-[11px]">Supramax</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedRouteId}
              className="w-full py-2.5 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-bold text-xs transition-ui shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Computing CP-SAT Solution...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Run Optimization Solver</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded bg-[#B94A48]/10 border border-[#B94A48]/30 text-[#B94A48] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* RIGHT STAGE: Optimization Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="op-section p-8 min-h-[380px] flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-full bg-[#F0F2EF] border border-[#D9DFDB] text-[#5E6965]">
                <Ship className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-[#17211F]">Solver Ready</h3>
                <p className="text-xs text-[#5E6965] leading-relaxed">
                  Select your cargo volume and laycan target window to evaluate optimal vessel assignment and minimum freight cost.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Status Bar */}
              <div
                className={`p-3.5 rounded border flex items-center justify-between gap-4 font-mono text-xs ${
                  result.status === "OPTIMAL"
                    ? "bg-[#287A57]/10 border-[#287A57]/30 text-[#287A57]"
                    : "bg-[#B97824]/10 border-[#B97824]/30 text-[#B97824]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {result.status === "OPTIMAL" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#287A57] flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#B97824] flex-shrink-0" />
                  )}
                  <span>Status: <strong className="uppercase">{result.status}</strong> — {result.message}</span>
                </div>
                <span className="text-[11px] text-[#5E6965]">OR-Tools CP-SAT</span>
              </div>

              {/* Recommended Charter Solution Primary Card */}
              {result.optimal_solution && (
                <div className="op-section p-5 space-y-4 border-l-4 border-l-[#176B63]">
                  <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-[#5E6965]">Recommended Vessel Class</div>
                      <div className="text-lg font-bold text-[#17211F] mt-0.5">
                        {result.optimal_solution.vessel_type_name} ({result.optimal_solution.vessel_type_code})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-[#5E6965]">Optimal Laycan Date</div>
                      <div className="text-xs font-bold text-[#C47A24] font-mono flex items-center gap-1.5 justify-end mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(result.optimal_solution.charter_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="op-subpanel p-3">
                      <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-[#176B63]" /> Forecasted Rate
                      </div>
                      <div className="text-base font-bold text-[#17211F] font-mono mt-1">
                        ${Number(result.optimal_solution.predicted_rate_usd_per_t).toFixed(2)} <span className="text-xs font-normal text-[#5E6965]">/ tonne</span>
                      </div>
                    </div>

                    <div className="op-subpanel p-3 border-[#176B63]/40 bg-[#176B63]/5">
                      <div className="text-[10px] uppercase font-mono text-[#176B63] flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-[#176B63]" /> Total Voyage Cost
                      </div>
                      <div className="text-lg font-bold text-[#176B63] font-mono mt-1">
                        ${Number(result.optimal_solution.total_freight_cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Laytime Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="op-subpanel p-3 space-y-1">
                      <div className="text-[#5E6965] flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-[#5E6965]" /> Loading Laytime
                      </div>
                      <div className="font-bold text-[#17211F] font-mono">
                        {Number(result.optimal_solution.estimated_loading_days).toFixed(2)} days
                      </div>
                      <div className="text-[10px] text-[#5E6965] font-mono">
                        Handling: {Number(result.optimal_solution.loading_tph_used).toLocaleString()} TPH
                      </div>
                    </div>

                    <div className="op-subpanel p-3 space-y-1">
                      <div className="text-[#5E6965] flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-[#5E6965]" /> Discharging Laytime
                      </div>
                      <div className="font-bold text-[#17211F] font-mono">
                        {Number(result.optimal_solution.estimated_discharging_days).toFixed(2)} days
                      </div>
                      <div className="text-[10px] text-[#5E6965] font-mono">
                        Handling: {Number(result.optimal_solution.discharging_tph_used).toLocaleString()} TPH
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vessel Physical Feasibility Table */}
              <div className="op-section p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211F] font-mono flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#176B63]" />
                    <span>Vessel Feasibility Evaluation</span>
                  </h3>
                  <span className="text-[11px] text-[#5E6965] font-mono">
                    {result.evaluated_candidates.length} Candidates Evaluated
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#D9DFDB] text-[#5E6965] text-[11px]">
                        <th className="pb-2">Vessel Class</th>
                        <th className="pb-2">Feasibility</th>
                        <th className="pb-2">Rate ($/t)</th>
                        <th className="pb-2 text-right">Total Voyage Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9DFDB]">
                      {result.evaluated_candidates.map((cand) => (
                        <tr key={cand.vessel_type_id} className="hover:bg-[#F0F2EF]/60">
                          <td className="py-2.5 pr-2">
                            <span className="font-bold text-[#17211F]">{cand.vessel_type_name}</span>{" "}
                            <span className="text-[#5E6965] text-[10px]">({cand.vessel_type_code})</span>
                          </td>
                          <td className="py-2.5">
                            {cand.is_feasible ? (
                              <span className="text-[#287A57] flex items-center gap-1 text-[11px] font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                              </span>
                            ) : (
                              <span className="text-[#B94A48] flex items-center gap-1 text-[11px] font-medium">
                                <XCircle className="w-3.5 h-3.5" /> Infeasible
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-[#17211F]">
                            {cand.best_rate_usd_per_t ? `$${Number(cand.best_rate_usd_per_t).toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2.5 text-right font-bold text-[#17211F]">
                            {cand.best_total_cost_usd ? `$${Number(cand.best_total_cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
