"use client";

import { useEffect, useState } from "react";
import {
  fetchRouteRates,
  fetchRoutes,
  ForecastRunRequest,
  ForecastRunResponse,
  FreightRate,
  Route,
  runForecast,
} from "@/lib/api";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Cpu,
  LineChart as LineChartIcon,
  Play,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ForecastExecution() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedVesselTypeId, setSelectedVesselTypeId] = useState<number>(1); // Capesize default
  const [horizonDays, setHorizonDays] = useState<number>(14);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastRun, setForecastRun] = useState<ForecastRunResponse | null>(null);
  const [historicalRates, setHistoricalRates] = useState<FreightRate[]>([]);

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

  useEffect(() => {
    async function loadHistory() {
      if (!selectedRouteId) return;
      try {
        const history = await fetchRouteRates(selectedRouteId, undefined, 30);
        setHistoricalRates(history);
      } catch (err) {
        console.error("Failed to fetch historical rates:", err);
      }
    }
    loadHistory();
  }, [selectedRouteId]);

  const handleRunForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId) return;

    setLoading(true);
    setError(null);

    const request: ForecastRunRequest = {
      route_id: selectedRouteId,
      vessel_type_id: selectedVesselTypeId,
      horizon_days: horizonDays,
    };

    try {
      const response = await runForecast(request);
      setForecastRun(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Forecast generation failed");
    } finally {

      setLoading(false);
    }
  };

  // Merge historical points + forecasted points for chart rendering
  const chartData = [
    ...historicalRates
      .slice()
      .reverse()
      .map((rate) => ({
        date: new Date(rate.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Historical: parseFloat(rate.rate_value),
        Predicted: undefined,
        P10: undefined,
        P90: undefined,
      })),
    ...((forecastRun?.points || forecastRun?.forecast_points || []).map((pt) => ({
      date: new Date(pt.target_ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Historical: undefined,
      Predicted: parseFloat(pt.predicted_value),
      P10: pt.p10 ? parseFloat(pt.p10) : undefined,
      P90: pt.p90 ? parseFloat(pt.p90) : undefined,
    }))),
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              <Cpu className="w-3.5 h-3.5" /> Phase 6 ML Forecast Service
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Multi-Horizon Quantile Freight Forecast Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Generate 7-day to 30-day ahead freight rate trajectories with P10/P50/P90 quantile confidence intervals using a linear trend baseline model.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-white">Linear Trend Forecast Model</div>
              <div className="text-[10px] text-slate-400 font-mono">v0.1.0 • Quantile Output</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs Control */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleRunForecast} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 font-bold text-sm text-white border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Forecast Run Configurations</span>
            </div>

            {/* Route Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Trade Route</label>
              <select
                value={selectedRouteId ?? ""}
                onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.origin_port.name} → {rt.destination_port.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Vessel Class</label>
              <select
                value={selectedVesselTypeId}
                onChange={(e) => setSelectedVesselTypeId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value={1}>Capesize (180,000 DWT)</option>
                <option value={2}>Panamax (75,000 DWT)</option>
                <option value={3}>Supramax (55,000 DWT)</option>
              </select>
            </div>

            {/* Horizon Days Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Forecast Horizon</span>
                <span className="text-[10px] text-cyan-400 font-mono">{horizonDays} Days Ahead</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setHorizonDays(days)}
                    className={`py-2 rounded-xl text-xs font-mono font-medium border transition-all ${
                      horizonDays === days
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              type="submit"
              disabled={loading || !selectedRouteId}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Executing Forecast Model Inference...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate Multi-Horizon Forecast</span>
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

          {forecastRun && (
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Forecast Run Execution Details</span>
              </div>
              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Run ID:</span>
                  <span>#{forecastRun.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Engine:</span>
                  <span>{forecastRun.model_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horizon:</span>
                  <span>{forecastRun.horizon_days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">{forecastRun.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Recharts Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <LineChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Freight Rate Trajectory Chart</h3>
                  <p className="text-xs text-slate-400">Historical Rates vs Forecasted Quantiles ($ / tonne)</p>
                </div>
              </div>

              {forecastRun && (
                <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                  {(forecastRun.points || forecastRun.forecast_points || []).length} Forecast Trajectory Points
                </div>
              )}
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

                  {/* Confidence Interval Bands */}
                  <Area type="monotone" dataKey="P90" stroke="none" fill="#06b6d4" fillOpacity={0.15} name="P90 Upper Band" />
                  <Area type="monotone" dataKey="P10" stroke="none" fill="#06b6d4" fillOpacity={0.1} name="P10 Lower Band" />

                  {/* Lines */}
                  <Line type="monotone" dataKey="Historical" stroke="#94a3b8" strokeWidth={2} dot={false} name="Historical Rate ($/t)" />
                  <Line type="monotone" dataKey="Predicted" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: "#06b6d4" }} activeDot={{ r: 6 }} name="Predicted Rate ($/t)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
