"use client";

import { ArrowRight, Database, LineChart, Scale, CheckCircle2 } from "lucide-react";

export default function LandingFlow() {
  const steps = [
    {
      num: "01",
      icon: Database,
      title: "Market Signals & Data",
      desc: "Seeded historical voyage rates, Baltic Exchange indices (BCI/BPI), port drafts, and live weather conditions.",
    },
    {
      num: "02",
      icon: LineChart,
      title: "Quantile Rate Trajectory",
      desc: "Linear Trend ML engine generates forward 7/14/30-day rate forecasts with P10/P50/P90 confidence bounds.",
    },
    {
      num: "03",
      icon: Scale,
      title: "OR-Tools CP-SAT Solver",
      desc: "Integer optimization computes minimum freight cost vessel selection subject to draft, LOA, and handling constraints.",
    },
    {
      num: "04",
      icon: CheckCircle2,
      title: "Optimal Charter Execution",
      desc: "Actionable chartering decision: recommended vessel class, exact laycan window, predicted rate, and laytime breakdown.",
    },
  ];

  return (
    <section id="flow" className="py-20 bg-[#F6F7F4] border-b border-[#D9DFDB]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B63] font-mono">
            Platform Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] tracking-tight">
            From Market Signals to Optimal Charter Execution
          </h2>
          <p className="text-sm text-[#5E6965]">
            How the platform transforms raw maritime market data into minimum-cost vessel allocation decisions.
          </p>
        </div>

        {/* Step Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="relative group">
                <div className="op-section p-6 space-y-4 h-full flex flex-col justify-between bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-2xl font-black text-[#176B63]/30 group-hover:text-[#176B63] transition-colors">
                        {st.num}
                      </span>
                      <div className="w-8 h-8 rounded bg-[#F0F2EF] text-[#176B63] flex items-center justify-center font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#17211F] tracking-tight">
                      {st.title}
                    </h3>

                    <p className="text-xs text-[#5E6965] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector (for desktop) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#D9DFDB]">
                    <ArrowRight className="w-5 h-5 text-[#176B63]/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
