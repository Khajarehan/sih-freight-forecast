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
  Sparkles,
  XCircle,
} from "lucide-react";


export default function OptimizationCalculator() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [cargoQuantity, setCargoQuantity] = useState<number>(65000);

  // Laycan default dates (tomorrow to +7 days)
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() + 1);
  const defaultEnd = new Date(today);
  defaultEnd.setDate(today.getDate() + 7);

  const [laycanStart, setLaycanStart] = useState<string>(defaultStart.toISOString().split("T")[0]);
  const [laycanEnd, setLaycanEnd] = useState<string>(defaultEnd.toISOString().split("T")[0]);

  // Vessel candidates (default all checked)
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

    // Filter selected vessel candidates (IDs matching synthetic seed: 1=Capesize, 2=Panamax, 3=Supramax if present)
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Phase 7 OR-Tools Optimization Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Chartering Decision Support & Cost Optimizer
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Find the optimal vessel class and charter date within your laycan window. Minimizes total voyage freight cost while strictly enforcing physical draft, LOA, beam, and vessel capacity limits.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <Scale className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-white">Google OR-Tools CP-SAT</div>
              <div className="text-[10px] text-slate-400 font-mono">Integer Programming Solver</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Controls Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleOptimize} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 font-bold text-sm text-white border-b border-slate-800 pb-3">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Cargo & Procurement Requirements</span>
            </div>

            {/* Route Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Select Shipping Trade Route</label>
              <select
                value={selectedRouteId ?? ""}
                onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.origin_port.name} ({rt.origin_port.unlocode}) → {rt.destination_port.name} ({rt.destination_port.unlocode}) [{rt.distance_nm} nm]
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo Quantity Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Cargo Volume (Tonnes)</span>
                <span className="text-[10px] text-slate-400 font-mono">Bulk Capacity</span>
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="1000"
                  max="250000"
                  step="1000"
                  value={cargoQuantity}
                  onChange={(e) => setCargoQuantity(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Laycan Window Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Laycan Start Date</label>
                <input
                  type="date"
                  value={laycanStart}
                  onChange={(e) => setLaycanStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Laycan End Date</label>
                <input
                  type="date"
                  value={laycanEnd}
                  onChange={(e) => setLaycanEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Candidate Vessel Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Candidate Vessel Classes</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includeCapesize}
                    onChange={(e) => setIncludeCapesize(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 font-medium">Capesize</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includePanamax}
                    onChange={(e) => setIncludePanamax(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 font-medium">Panamax</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includeSupramax}
                    onChange={(e) => setIncludeSupramax(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 font-medium">Supramax</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedRouteId}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Computing Optimal CP-SAT Solution...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Chartering Optimization</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Optimization Results Display */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="h-full min-h-[380px] p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-800/60 text-slate-500">
                <Ship className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-white">No Optimization Run Yet</h3>
                <p className="text-xs text-slate-400">
                  Configure cargo tonnage, select shipping route and laycan date window, then run the optimizer to compute minimum chartering cost.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Status Header Banner */}
              <div
                className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
                  result.status === "OPTIMAL"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.status === "OPTIMAL" ? (
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-400" />
                  )}
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <span>Optimization Result: {result.status}</span>
                    </div>
                    <div className="text-xs opacity-90">{result.message}</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-950/60 text-xs font-mono border border-current">
                  OR-Tools CP-SAT
                </div>
              </div>

              {/* Optimal Solution Card */}
              {result.optimal_solution && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Ship className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Recommended Vessel Class</div>
                        <div className="text-lg font-extrabold text-white">
                          {result.optimal_solution.vessel_type_name} ({result.optimal_solution.vessel_type_code})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Optimal Charter Date</div>
                      <div className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(result.optimal_solution.charter_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Forecasted Rate
                      </div>
                      <div className="text-lg font-bold text-white font-mono">
                        ${Number(result.optimal_solution.predicted_rate_usd_per_t).toFixed(2)} <span className="text-xs font-normal text-slate-400">/ tonne</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-cyan-400 flex items-center gap-1 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Total Freight Cost
                      </div>
                      <div className="text-xl font-extrabold text-cyan-300 font-mono">
                        ${Number(result.optimal_solution.total_freight_cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Operational Laytime & Handling TPH */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                      <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Loading Laytime
                      </div>
                      <div className="font-bold text-slate-200 font-mono">
                        {Number(result.optimal_solution.estimated_loading_days).toFixed(2)} days
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Handling Rate: {Number(result.optimal_solution.loading_tph_used).toLocaleString()} TPH
                        {result.optimal_solution.is_origin_tph_fallback && (
                          <span className="text-amber-400 ml-1">(Fallback)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                      <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> Discharging Laytime
                      </div>
                      <div className="font-bold text-slate-200 font-mono">
                        {Number(result.optimal_solution.estimated_discharging_days).toFixed(2)} days
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Handling Rate: {Number(result.optimal_solution.discharging_tph_used).toLocaleString()} TPH
                        {result.optimal_solution.is_destination_tph_fallback && (
                          <span className="text-amber-400 ml-1">(Fallback)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Candidate Evaluation Breakdown Matrix */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Candidate Physical Feasibility Evaluation Matrix</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.evaluated_candidates.length} Vessel Classes Evaluated
                  </span>
                </div>

                <div className="space-y-3">
                  {result.evaluated_candidates.map((cand) => (
                    <div
                      key={cand.vessel_type_id}
                      className={`p-4 rounded-2xl border transition-all ${
                        cand.is_feasible
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-rose-950/10 border-rose-500/20 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {cand.is_feasible ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-white">
                              {cand.vessel_type_name} ({cand.vessel_type_code})
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {cand.is_feasible ? "Physically Feasible for Port Limits" : "Physical Hard Constraint Violations"}
                            </div>
                          </div>
                        </div>

                        {cand.is_feasible && cand.best_total_cost_usd && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-400 font-mono">
                              ${Number(cand.best_total_cost_usd).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ${Number(cand.best_rate_usd_per_t).toFixed(2)}/t
                            </div>
                          </div>
                        )}
                      </div>

                      {!cand.is_feasible && cand.infeasibility_reasons.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-rose-500/10 space-y-1">
                          {cand.infeasibility_reasons.map((reason, idx) => (
                            <div key={idx} className="text-[11px] text-rose-300/90 font-mono flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-rose-400" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
