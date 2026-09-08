"use client";

import { useState } from "react";
import Navbar, { NavTab } from "@/components/navbar";
import MapboxShippingMap from "@/components/mapbox-shipping-map";
import OptimizationCalculator from "@/components/optimization-calculator";
import ForecastExecution from "@/components/forecast-execution";
import RouteAnalytics from "@/components/route-analytics";
import BalticIndicesChart from "@/components/baltic-indices-chart";
import PortsOverview from "@/components/ports-overview";
import { Ship, ArrowRight, Scale, Cpu } from "lucide-react";


export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/60 p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
                <Ship className="w-3.5 h-3.5" /> SIH 26006 — Phase 8 Production Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Intelligent Freight Forecasting & Chartering Platform
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Mapbox GIS maritime network visualization, OR-Tools chartering optimization engine, multi-horizon freight rate forecasts, Baltic indices, and port weather monitoring for bulk cargo procurement into East Coast India.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab("optimizer")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Scale className="w-4 h-4" />
                <span>Charter Optimizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab("forecast")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>ML Forecast Engine</span>
              </button>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Mapbox Shipping Map Layer */}
            <MapboxShippingMap />

            <RouteAnalytics />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BalticIndicesChart />
              <PortsOverview />
            </div>
          </div>
        )}

        {activeTab === "optimizer" && (
          <div className="animate-in fade-in duration-300">
            <OptimizationCalculator />
          </div>
        )}

        {activeTab === "forecast" && (
          <div className="animate-in fade-in duration-300">
            <ForecastExecution />
          </div>
        )}

        {activeTab === "routes" && (
          <div className="animate-in fade-in duration-300">
            <RouteAnalytics />
          </div>
        )}

        {activeTab === "baltic" && (
          <div className="animate-in fade-in duration-300">
            <BalticIndicesChart />
          </div>
        )}

        {activeTab === "ports" && (
          <div className="animate-in fade-in duration-300">
            <PortsOverview />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 glass-panel py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>SIH 26006 Freight Forecasting Platform — Phase 8 Mapbox + Dashboard</span>
          <span className="font-mono text-slate-400">Mapbox GL JS • OR-Tools CP-SAT • Linear Trend ML • FastAPI</span>
        </div>
      </footer>
    </div>
  );
}
