"use client";

import { useEffect, useState } from "react";
import { Route, FreightRate, fetchRoutes, fetchRouteRates } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Compass, Anchor, Filter, TrendingUp, DollarSign, Calendar, Layers } from "lucide-react";

export default function RouteAnalytics() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [vesselType, setVesselType] = useState<string>("ALL");
  const [rates, setRates] = useState<FreightRate[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load routes on mount
  useEffect(() => {
    async function loadRoutes() {
      setLoadingRoutes(true);
      setError(null);
      try {
        const data = await fetchRoutes();
        setRoutes(data);
        if (data.length > 0) {
          setSelectedRouteId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load routes");
      } finally {
        setLoadingRoutes(false);
      }
    }
    loadRoutes();
  }, []);

  // Load freight rates when route or vessel filter changes
  useEffect(() => {
    if (selectedRouteId === null) return;
    const routeId = selectedRouteId;
    async function loadRates() {
      setLoadingRates(true);
      try {
        const filterType = vesselType === "ALL" ? undefined : vesselType;
        const data = await fetchRouteRates(routeId, filterType, 300);
        // Sort ascending by timestamp for proper time-series charting
        const sorted = [...data].sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
        );
        setRates(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rate data");
      } finally {
        setLoadingRates(false);
      }
    }
    loadRates();
  }, [selectedRouteId, vesselType]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  // Prepare chart data
  const chartData = rates.map((r) => ({
    date: new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    rate: parseFloat(r.rate_value),
    vessel: r.vessel_type_id === 1 ? "Capesize" : r.vessel_type_id === 2 ? "Panamax" : "Supramax",
  }));

  const latestRate = rates.length > 0 ? parseFloat(rates[rates.length - 1].rate_value) : null;
  const minRate = rates.length > 0 ? Math.min(...rates.map((r) => parseFloat(r.rate_value))) : null;
  const maxRate = rates.length > 0 ? Math.max(...rates.map((r) => parseFloat(r.rate_value))) : null;

  return (
    <div className="space-y-6">
      {/* Route & Filter Controls */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Route Selection & Freight Rates</h2>
              <p className="text-xs text-slate-400">
                Historical voyage rates (USD/Tonne) into East Coast India ports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Route Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <select
                value={selectedRouteId ?? ""}
                onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                disabled={loadingRoutes}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                    {r.origin_port.name} ({r.origin_port.unlocode}) → {r.destination_port.name} ({r.destination_port.unlocode})
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Type Filter */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Filter className="w-4 h-4 text-blue-400" />
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">All Vessel Types</option>
                <option value="CAPESIZE" className="bg-slate-900 text-slate-200">Capesize</option>
                <option value="PANAMAX" className="bg-slate-900 text-slate-200">Panamax</option>
                <option value="SUPRAMAX" className="bg-slate-900 text-slate-200">Supramax</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      {selectedRoute && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Route Distance</span>
              <Compass className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {parseFloat(selectedRoute.distance_nm).toLocaleString()} <span className="text-xs font-normal text-slate-400">NM</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {selectedRoute.origin_port.name} → {selectedRoute.destination_port.name}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Latest Rate</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {latestRate !== null ? `$${latestRate.toFixed(2)}` : "—"}
              <span className="text-xs font-normal text-slate-400"> / tonne</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Voyage USD Basis</div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Rate Range</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {minRate !== null && maxRate !== null ? `$${minRate.toFixed(1)} - $${maxRate.toFixed(1)}` : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Historical Min - Max</div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Observations</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {rates.length} <span className="text-xs font-normal text-slate-400">records</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Seeded Time-Series</div>
          </div>
        </div>
      )}

      {/* Main Freight Rate Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Freight Rate Trajectory (USD / Tonne)
          </h3>
          {loadingRates && (
            <span className="text-xs text-cyan-400 animate-pulse">Loading rates...</span>
          )}
        </div>

        <div className="h-80 w-full">
          {rates.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  unit=" $"
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    typeof value === "number" ? `$${value.toFixed(2)} / tonne` : `${value}`,
                    "Freight Rate",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Freight Rate ($/Tonne)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#38bdf8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              {loadingRates ? "Fetching time-series data..." : "No rate observations available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
