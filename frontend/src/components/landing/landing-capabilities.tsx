"use client";

import { BarChart3, Layers, Scale, TrendingUp } from "lucide-react";

export default function LandingCapabilities() {
  const capabilities = [
    {
      icon: TrendingUp,
      title: "Freight Rate Trajectory Forecasting",
      subtitle: "Multi-Horizon Quantile Machine Learning Predictions",
      description:
        "Evaluate 7, 14, and 30-day forward spot rate trajectories with lower (P10), median (P50), and upper (P90) confidence bounds for risk sensitivity analysis during charter negotiation.",
      badge: "Linear Trend Baseline",
    },
    {
      icon: Scale,
      title: "Vessel Charter Cost Optimization",
      subtitle: "Google OR-Tools CP-SAT Integer Programming Engine",
      description:
        "Calculate minimum-cost vessel allocation and optimal laycan dates. Evaluates candidate vessel classes (Capesize, Panamax, Supramax) against port draft, LOA, and handling constraints.",
      badge: "Integer Solver",
    },
    {
      icon: Layers,
      title: "Port Technical Limits & Weather Telemetry",
      subtitle: "Operational Physical Feasibility Matrix",
      description:
        "Real-time monitoring of berth draft thresholds, maximum LOA limits, loading/discharging TPH capacities, and live wind speed, wave height, and weather conditions.",
      badge: "East Coast India Focus",
    },
    {
      icon: BarChart3,
      title: "Baltic Market Signals & Route Intelligence",
      subtitle: "Global Bulk Commodity Benchmarks",
      description:
        "Track Baltic Capesize Index (BCI), Baltic Panamax Index (BPI), and Baltic Supramax Index (BSI) trends mapped to major bulk trade corridors into Indian ports.",
      badge: "Baltic Exchange Rates",
    },
  ];

  return (
    <section id="capabilities" className="py-20 bg-white border-b border-[#D9DFDB]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B63] font-mono">
            Platform Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] tracking-tight">
            Integrated Decision Support for Maritime Procurement
          </h2>
          <p className="text-sm text-[#5E6965] leading-relaxed">
            Designed specifically for bulk cargo charterers, vessel operators, and port logisticians managing dry bulk supply chains into East Coast India.
          </p>
        </div>

        {/* Spacious Asymmetric Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="op-section p-6 space-y-4 hover:border-[#176B63] transition-ui group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded bg-[#F0F2EF] group-hover:bg-[#176B63]/10 text-[#176B63] flex items-center justify-center font-bold transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-[#176B63] text-[11px] font-mono font-medium">
                    {cap.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#17211F] tracking-tight group-hover:text-[#176B63] transition-colors">
                    {cap.title}
                  </h3>
                  <div className="text-xs font-mono text-[#5E6965]">
                    {cap.subtitle}
                  </div>
                </div>

                <p className="text-xs text-[#5E6965] leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
