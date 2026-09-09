"use client";

import { useEffect, useState } from "react";
import { BalticIndex, fetchBalticIndices } from "@/lib/api";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function BalticIndicesChart() {
  const [indices, setIndices] = useState<BalticIndex[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadIndices() {
      try {
        const data = await fetchBalticIndices(undefined, 90);
        setIndices(data);
      } catch (err) {
        console.error("Failed to fetch Baltic indices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIndices();
  }, []);

  const dateMap: Record<string, { date: string; BCI?: number; BPI?: number; BSI?: number }> = {};

  indices.forEach((item) => {
    const d = new Date(item.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dateMap[d]) {
      dateMap[d] = { date: d };
    }
    const val = parseFloat(item.value);
    if (item.index_code === "BCI") dateMap[d].BCI = val;
    if (item.index_code === "BPI") dateMap[d].BPI = val;
    if (item.index_code === "BSI") dateMap[d].BSI = val;
  });

  const chartData = Object.values(dateMap).reverse();

  const bciLatest = indices.find((i) => i.index_code === "BCI")?.value || "1335";
  const bpiLatest = indices.find((i) => i.index_code === "BPI")?.value || "1268";
  const bsiLatest = indices.find((i) => i.index_code === "BSI")?.value || "1481";

  return (
    <div className="op-section p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17211F] font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#176B63]" />
            <span>Baltic Exchange Indices</span>
          </h2>
          <p className="text-xs text-[#5E6965] mt-0.5">
            Benchmark Capesize (BCI), Panamax (BPI), and Supramax (BSI) index levels.
          </p>
        </div>
      </div>

      {/* Restrained Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center justify-between">
            <span>BCI (Capesize)</span>
            <TrendingUp className="w-3 h-3 text-[#C47A24]" />
          </div>
          <div className="text-lg font-bold text-[#17211F] font-mono mt-1">
            {parseFloat(bciLatest).toLocaleString()}{" "}
            <span className="text-[10px] font-normal text-[#5E6965]">pts</span>
          </div>
        </div>

        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center justify-between">
            <span>BPI (Panamax)</span>
            <TrendingUp className="w-3 h-3 text-[#176B63]" />
          </div>
          <div className="text-lg font-bold text-[#17211F] font-mono mt-1">
            {parseFloat(bpiLatest).toLocaleString()}{" "}
            <span className="text-[10px] font-normal text-[#5E6965]">pts</span>
          </div>
        </div>

        <div className="op-subpanel p-3">
          <div className="text-[10px] uppercase font-mono text-[#5E6965] flex items-center justify-between">
            <span>BSI (Supramax)</span>
            <TrendingUp className="w-3 h-3 text-[#2F8279]" />
          </div>
          <div className="text-lg font-bold text-[#17211F] font-mono mt-1">
            {parseFloat(bsiLatest).toLocaleString()}{" "}
            <span className="text-[10px] font-normal text-[#5E6965]">pts</span>
          </div>
        </div>
      </div>

      {/* Recharts Baltic Index Trend */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-[#5E6965]">Baltic Exchange Index History</div>
        <div className="h-[280px] w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-[#5E6965] font-mono animate-pulse">
              Loading Baltic Market Data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" />
                <XAxis dataKey="date" stroke="#5E6965" tick={{ fontSize: 11 }} />
                <YAxis stroke="#5E6965" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D9DFDB", borderRadius: "6px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelStyle={{ color: "#17211F", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line type="monotone" dataKey="BCI" stroke="#C47A24" strokeWidth={2} dot={false} name="BCI (Capesize)" />
                <Line type="monotone" dataKey="BPI" stroke="#176B63" strokeWidth={2} dot={false} name="BPI (Panamax)" />
                <Line type="monotone" dataKey="BSI" stroke="#2F8279" strokeWidth={2} dot={false} name="BSI (Supramax)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
