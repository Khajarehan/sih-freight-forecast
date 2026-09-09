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
  const [selectedVesselTypeId, setSelectedVesselTypeId] = useState<number>(1);
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
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="op-section p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#17211F] tracking-tight">
              Freight Rate Forecast Engine
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#F0F2EF] text-[#176B63] text-[11px] font-medium border border-[#D9DFDB]">
              Linear Trend Baseline v0.1.0
            </span>
          </div>
          <p className="text-xs text-[#5E6965] mt-1">
            Multi-horizon quantile freight rate predictions with P10/P50/P90 confidence intervals for voyage planning into East Coast India.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs font-mono text-[#17211F]">
          <TrendingUp className="w-4 h-4 text-[#176B63]" />
          <span>Quantile Output Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Forecast Control Form */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleRunForecast} className="op-section p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#17211F] border-b border-[#D9DFDB] pb-3 font-mono">
              <Activity className="w-4 h-4 text-[#176B63]" />
              <span>Forecast Run Parameters</span>
            </div>

            {/* Route Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#17211F]">Target Trade Route</label>
              <select
                value={selectedRouteId ?? ""}
                onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] focus:outline-none focus:border-[#176B63]"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.origin_port.name} → {rt.destination_port.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#17211F]">Vessel Class</label>
              <select
                value={selectedVesselTypeId}
                onChange={(e) => setSelectedVesselTypeId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] focus:outline-none focus:border-[#176B63]"
              >
                <option value={1}>Capesize (180,000 DWT)</option>
                <option value={2}>Panamax (75,000 DWT)</option>
                <option value={3}>Supramax (55,000 DWT)</option>
              </select>
            </div>

            {/* Horizon Days Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#17211F] flex justify-between">
                <span>Forecast Horizon</span>
                <span className="text-[11px] text-[#176B63] font-mono">{horizonDays} Days</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setHorizonDays(days)}
                    className={`py-2 rounded text-xs font-mono font-medium border transition-ui ${
                      horizonDays === days
                        ? "bg-[#176B63]/10 border-[#176B63] text-[#176B63]"
                        : "bg-[#F6F7F4] border-[#D9DFDB] text-[#5E6965] hover:border-[#176B63]"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
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
                  <span>Computing Inference...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate Forecast Trajectory</span>
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

          {forecastRun && (
            <div className="op-section p-4 space-y-2 text-xs font-mono">
              <div className="font-bold text-[#17211F] flex items-center gap-2 border-b border-[#D9DFDB] pb-2 text-[11px] uppercase">
                <BarChart3 className="w-3.5 h-3.5 text-[#176B63]" />
                <span>Forecast Run Execution</span>
              </div>
              <div className="space-y-1 text-[#5E6965] text-[11px]">
                <div className="flex justify-between">
                  <span>Run ID:</span>
                  <span className="text-[#17211F]">#{forecastRun.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Engine:</span>
                  <span className="text-[#17211F]">{forecastRun.model_version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Horizon:</span>
                  <span className="text-[#17211F]">{forecastRun.horizon_days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-[#287A57] font-bold">{forecastRun.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Recharts Wide Visualizer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="op-section p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3">
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-[#176B63]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211F] font-mono">
                  Freight Rate Trajectory (USD / Tonne)
                </h3>
              </div>

              {forecastRun && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-[#17211F] font-mono">
                  {(forecastRun.points || forecastRun.forecast_points || []).length} Trajectory Points
                </span>
              )}
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" />
                  <XAxis dataKey="date" stroke="#5E6965" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#5E6965" tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit=" $" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D9DFDB", borderRadius: "6px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    labelStyle={{ color: "#17211F", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />

                  {/* Quantile Bands */}
                  <Area type="monotone" dataKey="P90" stroke="none" fill="#176B63" fillOpacity={0.15} name="P90 Upper Band" />
                  <Area type="monotone" dataKey="P10" stroke="none" fill="#176B63" fillOpacity={0.1} name="P10 Lower Band" />

                  {/* Historical & Forecast Lines */}
                  <Line type="monotone" dataKey="Historical" stroke="#5E6965" strokeWidth={2} dot={false} name="Historical Rate ($/t)" />
                  <Line type="monotone" dataKey="Predicted" stroke="#176B63" strokeWidth={2.5} dot={{ r: 3, fill: "#176B63" }} activeDot={{ r: 5 }} name="Predicted Trajectory ($/t)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Guidance Section */}
          <div className="op-section p-4 space-y-1.5 text-xs">
            <h4 className="font-bold text-[#17211F] uppercase font-mono tracking-wider text-[11px]">
              Forecast Interpretation & Model Guidance
            </h4>
            <p className="text-[#5E6965] leading-relaxed text-[11px]">
              The predicted trajectory reflects linear trend extrapolation over the target {horizonDays}-day horizon based on seeded historical voyage rates. P10 and P90 quantile confidence bounds establish lower and upper rate boundary estimates for risk sensitivity analysis during charter negotiation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
