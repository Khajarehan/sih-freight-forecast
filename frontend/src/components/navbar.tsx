"use client";

import { useEffect, useState } from "react";
import { Ship, Database, CheckCircle2, AlertTriangle, RefreshCw, MapPin, Scale, Cpu, Activity, Compass } from "lucide-react";
import { fetchHealth, type Health } from "@/lib/api";

export type NavTab = "overview" | "optimizer" | "forecast" | "routes" | "baltic" | "ports";

type NavbarProps = {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
};

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Freight Forecast
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-mono">
                  Phase 8 Mapbox + Dashboard
                </span>
              </div>
              <p className="text-[11px] text-slate-400">East Coast India Chartering & ML Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map & Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("optimizer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "optimizer"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Charter Optimizer</span>
            </button>

            <button
              onClick={() => setActiveTab("forecast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "forecast"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Forecast</span>
            </button>

            <button
              onClick={() => setActiveTab("routes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "routes"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Freight Rates</span>
            </button>

            <button
              onClick={() => setActiveTab("baltic")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "baltic"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Baltic Indices
            </button>

            <button
              onClick={() => setActiveTab("ports")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "ports"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Ports & Weather</span>
            </button>
          </nav>

          {/* System Health Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              {loading ? (
                <span className="text-slate-400 animate-pulse">Connecting...</span>
              ) : error ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Offline
                </span>
              ) : (
                <span className="text-slate-300 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">API Online</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 text-[11px]">
                    {health?.database === "connected" ? "PostgreSQL" : health?.database}
                  </span>
                </span>
              )}
            </div>

            <button
              onClick={loadHealth}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh Health"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
