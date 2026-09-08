"use client";

import { useEffect, useState } from "react";
import { BalticIndex, fetchBalticIndices } from "@/lib/api";
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
import { Activity, BarChart3, TrendingUp, Calendar } from "lucide-react";

export default function BalticIndicesChart() {
  const [indices, setIndices] = useState<BalticIndex[]>([]);
  const [selectedIndexCode, setSelectedIndexCode] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const filterCode = selectedIndexCode === "ALL" ? undefined : selectedIndexCode;
        const data = await fetchBalticIndices(filterCode, 300);
        // Sort ascending by timestamp
        const sorted = [...data].sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
        );
        setIndices(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Baltic indices");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedIndexCode]);

  // Transform indices for multi-series chart if ALL selected, or single series
  // Pivot timestamps to merge BCI, BPI, BSI into single objects per timestamp
  const pivotedMap: Map<string, { date: string; BCI?: number; BPI?: number; BSI?: number }> = new Map();

  indices.forEach((item) => {
    const dateStr = new Date(item.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!pivotedMap.has(dateStr)) {
      pivotedMap.set(dateStr, { date: dateStr });
    }
    const entry = pivotedMap.get(dateStr)!;
    const val = parseFloat(item.value);
    if (item.index_code === "BCI") entry.BCI = val;
    if (item.index_code === "BPI") entry.BPI = val;
    if (item.index_code === "BSI") entry.BSI = val;
  });

  const chartData = Array.from(pivotedMap.values());

  // Calculate summary levels
  const bciValues = indices.filter((i) => i.index_code === "BCI").map((i) => parseFloat(i.value));
  const bpiValues = indices.filter((i) => i.index_code === "BPI").map((i) => parseFloat(i.value));
  const bsiValues = indices.filter((i) => i.index_code === "BSI").map((i) => parseFloat(i.value));

  const latestBCI = bciValues.length > 0 ? bciValues[bciValues.length - 1] : null;
  const latestBPI = bpiValues.length > 0 ? bpiValues[bpiValues.length - 1] : null;
  const latestBSI = bsiValues.length > 0 ? bsiValues[bsiValues.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Baltic Exchange Indices</h2>
            <p className="text-xs text-slate-400">
              Benchmark Capesize (BCI), Panamax (BPI), and Supramax (BSI) time-series
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedIndexCode}
            onChange={(e) => setSelectedIndexCode(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">All Baltic Indices</option>
            <option value="BCI" className="bg-slate-900 text-slate-200">BCI (Capesize Index)</option>
            <option value="BPI" className="bg-slate-900 text-slate-200">BPI (Panamax Index)</option>
            <option value="BSI" className="bg-slate-900 text-slate-200">BSI (Supramax Index)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Index Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-cyan-400">BCI — Capesize</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {latestBCI !== null ? latestBCI.toFixed(0) : "—"}
            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Baltic Capesize Index</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-blue-400">BPI — Panamax</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {latestBPI !== null ? latestBPI.toFixed(0) : "—"}
            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Baltic Panamax Index</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">BSI — Supramax</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {latestBSI !== null ? latestBSI.toFixed(0) : "—"}
            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Baltic Supramax Index</div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Baltic Index Benchmark Values
          </h3>
          {loading && <span className="text-xs text-blue-400 animate-pulse">Loading indices...</span>}
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [typeof value === "number" ? `${value.toFixed(1)} pts` : `${value}`, "Index Level"]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                {(selectedIndexCode === "ALL" || selectedIndexCode === "BCI") && (
                  <Line
                    type="monotone"
                    dataKey="BCI"
                    name="BCI (Capesize)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {(selectedIndexCode === "ALL" || selectedIndexCode === "BPI") && (
                  <Line
                    type="monotone"
                    dataKey="BPI"
                    name="BPI (Panamax)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {(selectedIndexCode === "ALL" || selectedIndexCode === "BSI") && (
                  <Line
                    type="monotone"
                    dataKey="BSI"
                    name="BSI (Supramax)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              {loading ? "Fetching Baltic data..." : "No index observations available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
