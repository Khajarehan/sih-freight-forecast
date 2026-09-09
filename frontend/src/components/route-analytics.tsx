"use client";

import { useEffect, useState } from "react";
import { fetchRouteRates, fetchRoutes, FreightRate, Route } from "@/lib/api";
import { Activity, ArrowUpRight, BarChart, Compass, Filter } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function RouteAnalytics() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [rates, setRates] = useState<FreightRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRoutes() {
      try {
        const data = await fetchRoutes();
        setRoutes(data);
        if (data.length > 0) {
          setSelectedRouteId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch routes:", err);
      }
    }
    loadRoutes();
  }, []);

  useEffect(() => {
    async function loadRates() {
      if (!selectedRouteId) return;
      setLoading(true);
      try {
        const data = await fetchRouteRates(selectedRouteId, undefined, 60);
        setRates(data);
      } catch (err) {
        console.error("Failed to fetch route rates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, [selectedRouteId]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const chartData = rates
    .slice()
    .reverse()
    .map((item) => ({
      date: new Date(item.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Rate: parseFloat(item.rate_value),
    }));

  const latestRate = rates.length > 0 ? parseFloat(rates[0].rate_value) : 0;
  const maxRate = rates.length > 0 ? Math.max(...rates.map((r) => parseFloat(r.rate_value))) : 0;
  const minRate = rates.length > 0 ? Math.min(...rates.map((r) => parseFloat(r.rate_value))) : 0;

  return (
    <div className="op-section p-5 space-y-5">
      {/* Header & Route Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9DFDB] pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#17211F] font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#176B63]" />
            <span>Freight Rates & Route Market Intelligence</span>
          </h2>
          <p className="text-xs text-[#5E6965] mt-0.5">
            Historical spot charter freight rates for major bulk trade corridors into East Coast India.
          </p>
        </div>

        {/* Route Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#5E6965]" />
          <select
            value={selectedRouteId ?? ""}
            onChange={(e) => setSelectedRouteId(Number(e.target.value))}
            className="px-3 py-1.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs text-[#17211F] font-mono focus:outline-none focus:border-[#176B63]"
          >
            {routes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.origin_port.name} → {rt.destination_port.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Terminal Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#176B63]" /> Distance
          </div>
          <div className="text-base font-bold text-[#17211F] font-mono mt-0.5">
            {selectedRoute?.distance_nm ? `${selectedRoute.distance_nm.toLocaleString()} NM` : "—"}
          </div>
          <div className="text-[10px] text-[#5E6965] mt-0.5">Nautical Miles</div>
        </div>

        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-[#C47A24]" /> Latest Spot Rate
          </div>
          <div className="text-base font-bold text-[#C47A24] font-mono mt-0.5">
            ${latestRate.toFixed(2)} <span className="text-xs font-normal text-[#5E6965]">/ t</span>
          </div>
          <div className="text-[10px] text-[#5E6965] mt-0.5">Current Charter Rate</div>
        </div>

        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center gap-1">
            <BarChart className="w-3.5 h-3.5 text-[#176B63]" /> Rate Range
          </div>
          <div className="text-base font-bold text-[#17211F] font-mono mt-0.5">
            ${minRate.toFixed(2)} – ${maxRate.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#5E6965] mt-0.5">60-Day Min / Max</div>
        </div>

        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965]">Observations</div>
          <div className="text-base font-bold text-[#17211F] font-mono mt-0.5">
            {rates.length} Points
          </div>
          <div className="text-[10px] text-[#5E6965] mt-0.5">Seeded Historical Voyages</div>
        </div>
      </div>

      {/* Historical Freight Rate Line Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#5E6965]">
          <span>Historical Rate Trend ($ / Tonne)</span>
          <span>{selectedRoute?.origin_port.name} → {selectedRoute?.destination_port.name}</span>
        </div>

        <div className="h-[280px] w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-[#5E6965] font-mono animate-pulse">
              Loading Route Rates...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" />
                <XAxis dataKey="date" stroke="#5E6965" tick={{ fontSize: 11 }} />
                <YAxis stroke="#5E6965" tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit=" $" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D9DFDB", borderRadius: "6px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelStyle={{ color: "#17211F", fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="Rate" stroke="#176B63" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Spot Freight Rate ($/t)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
