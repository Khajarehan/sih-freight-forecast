"use client";

import { useState } from "react";
import Navbar, { NavTab } from "@/components/navbar";
import MapboxShippingMap from "@/components/mapbox-shipping-map";
import OptimizationCalculator from "@/components/optimization-calculator";
import ForecastExecution from "@/components/forecast-execution";
import RouteAnalytics from "@/components/route-analytics";
import BalticIndicesChart from "@/components/baltic-indices-chart";
import PortsOverview from "@/components/ports-overview";
import { ArrowRight, Scale, TrendingUp, ShieldAlert, Anchor } from "lucide-react";

export default function PlatformDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F4] text-[#17211F]">
      {/* Top Application Shell Header & Nav */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Operational Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Executive Workspace Header */}
            <div className="op-section p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#17211F] tracking-tight">
                    Freight Intelligence Command Center
                  </h1>
                </div>
                <p className="text-xs text-[#5E6965] mt-1">
                  Bulk dry cargo procurement, real-time freight rate trajectories, and vessel charter optimization for East Coast India.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("optimizer")}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-medium text-xs transition-ui shadow-sm"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Launch Charter Optimizer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-white hover:bg-[#F0F2EF] border border-[#D9DFDB] text-[#17211F] font-medium text-xs transition-ui"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#176B63]" />
                  <span>Rate Forecast Engine</span>
                </button>
              </div>
            </div>

            {/* Integrated Market Snapshot Horizontal Region */}
            <div className="op-section p-4">
              <div className="text-[11px] font-bold text-[#5E6965] uppercase tracking-wider mb-3">
                Market Snapshot & Benchmarks
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#D9DFDB]">
                <div className="pt-2 md:pt-0 md:px-3">
                  <div className="text-xs text-[#5E6965]">BCI (Capesize)</div>
                  <div className="text-lg font-bold text-[#17211F] font-mono mt-0.5">
                    1,335 <span className="text-xs font-normal text-[#287A57]">+1.2%</span>
                  </div>
                  <div className="text-[11px] text-[#5E6965] mt-0.5">Baltic Capesize Benchmark</div>
                </div>

                <div className="pt-2 md:pt-0 md:px-3">
                  <div className="text-xs text-[#5E6965]">BPI (Panamax)</div>
                  <div className="text-lg font-bold text-[#17211F] font-mono mt-0.5">
                    1,268 <span className="text-xs font-normal text-[#5E6965]">0.0%</span>
                  </div>
                  <div className="text-[11px] text-[#5E6965] mt-0.5">Baltic Panamax Benchmark</div>
                </div>

                <div className="pt-2 md:pt-0 md:px-3">
                  <div className="text-xs text-[#5E6965]">Spot Freight Rate</div>
                  <div className="text-lg font-bold text-[#C47A24] font-mono mt-0.5">
                    $13.60 <span className="text-xs font-normal text-[#5E6965]">/ tonne</span>
                  </div>
                  <div className="text-[11px] text-[#5E6965] mt-0.5">Hay Point → Kamarajar Route</div>
                </div>

                <div className="pt-2 md:pt-0 md:px-3">
                  <div className="text-xs text-[#5E6965]">Operational Ports</div>
                  <div className="text-lg font-bold text-[#17211F] font-mono mt-0.5">
                    6 Active <span className="text-xs font-normal text-[#287A57]">Normal</span>
                  </div>
                  <div className="text-[11px] text-[#5E6965] mt-0.5">3 East Coast India Ports</div>
                </div>
              </div>
            </div>

            {/* Split Hero Workspace: Interactive Shipping Map + Operational Conditions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <MapboxShippingMap />
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="op-section p-5 space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#17211F] flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#C47A24]" />
                        <span>Operational Conditions</span>
                      </h2>
                      <span className="text-[10px] text-[#5E6965] font-mono">LIVE SIGNALS</span>
                    </div>

                    <div className="space-y-3">
                      <div className="op-subpanel p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#17211F] font-medium">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Anchor className="w-3.5 h-3.5 text-[#176B63]" /> Kamarajar (Ennore)
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#287A57]/10 text-[#287A57] text-[10px] font-medium">
                            Clear
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5E6965]">
                          Max Draft: 16.0m • Handling Rate: 3,000 TPH • Weather: Normal
                        </p>
                      </div>

                      <div className="op-subpanel p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#17211F] font-medium">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Anchor className="w-3.5 h-3.5 text-[#176B63]" /> Paradip Port
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#287A57]/10 text-[#287A57] text-[10px] font-medium">
                            Clear
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5E6965]">
                          Max Draft: 17.1m • Handling Rate: 4,000 TPH • Weather: Moderate Winds
                        </p>
                      </div>

                      <div className="op-subpanel p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#17211F] font-medium">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Anchor className="w-3.5 h-3.5 text-[#176B63]" /> Visakhapatnam Port
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#287A57]/10 text-[#287A57] text-[10px] font-medium">
                            Clear
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5E6965]">
                          Max Draft: 18.1m • Handling Rate: 4,500 TPH • Weather: Clear
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#D9DFDB] text-[11px] text-[#5E6965] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Optimization Solver:</span>
                      <span className="text-[#17211F] font-medium">Google OR-Tools CP-SAT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Forecast Model:</span>
                      <span className="text-[#17211F] font-medium">Linear Trend v0.1.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Corridor Analytics Section */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E6965] font-mono">
                Trade Corridor Analytics
              </h2>
              <RouteAnalytics />
            </div>

            {/* Baltic Market & Port Specifications Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E6965] font-mono">
                  Baltic Indices Terminal
                </h2>
                <BalticIndicesChart />
              </div>
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E6965] font-mono">
                  Port Technical Specifications
                </h2>
                <PortsOverview />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Tab Views */}
        {activeTab === "optimizer" && <OptimizationCalculator />}
        {activeTab === "forecast" && <ForecastExecution />}
        {activeTab === "routes" && <RouteAnalytics />}
        {activeTab === "baltic" && <BalticIndicesChart />}
        {activeTab === "ports" && <PortsOverview />}
      </main>

      {/* Operational Footer */}
      <footer className="bg-white border-t border-[#D9DFDB] py-4 text-xs text-[#5E6965] mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#17211F]">SIH-26006 Freight Forecasting & Chartering Platform</span>
          <span className="font-mono text-[#5E6965]">Mapbox GL JS • OR-Tools CP-SAT • Linear Trend ML • FastAPI • PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
