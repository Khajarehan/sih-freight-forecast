"use client";

import Link from "next/link";
import { ArrowRight, Compass, Scale, ShieldCheck, TrendingUp } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-[#F6F7F4] border-b border-[#D9DFDB]">
      {/* Background Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8E5_1px,transparent_1px),linear-gradient(to_bottom,#E2E8E5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT: Product Story & CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#176B63]/10 border border-[#176B63]/30 text-[#176B63] text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#176B63] animate-pulse" />
              <span>SIH-26006 Decision-Support Workstation</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17211F] tracking-tight leading-[1.15]">
                Forecast the market. <br />
                <span className="text-[#176B63]">Optimize the voyage.</span> <br />
                Make the decision.
              </h1>
              <p className="text-sm sm:text-base text-[#5E6965] max-w-2xl leading-relaxed pt-2">
                A specialized bulk dry cargo intelligence workstation for East Coast India. Combining machine learning quantile rate forecasts with Google OR-Tools CP-SAT vessel charter optimization.
              </p>
            </div>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/platform"
                className="flex items-center gap-2.5 px-6 py-3 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-bold text-sm transition-ui shadow-md group"
              >
                <span>Enter Command Center</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#capabilities"
                className="flex items-center gap-2 px-5 py-3 rounded bg-white hover:bg-[#F0F2EF] border border-[#D9DFDB] text-[#17211F] font-semibold text-sm transition-ui"
              >
                <span>Explore Capabilities</span>
              </a>
            </div>

            {/* Key Platform Indicators Strip */}
            <div className="pt-6 border-t border-[#D9DFDB] grid grid-cols-3 gap-4 font-mono text-xs text-[#5E6965]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#17211F]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#176B63]" />
                  <span>ML Forecast</span>
                </div>
                <div className="text-[11px]">P10 / P50 / P90 Bands</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#17211F]">
                  <Scale className="w-3.5 h-3.5 text-[#176B63]" />
                  <span>OR-Tools Solver</span>
                </div>
                <div className="text-[11px]">Integer CP-SAT Engine</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#17211F]">
                  <Compass className="w-3.5 h-3.5 text-[#176B63]" />
                  <span>GIS Routes</span>
                </div>
                <div className="text-[11px]">East Coast IN Hubs</div>
              </div>
            </div>

          </div>

          {/* RIGHT: Animated Maritime Route Visualization Canvas */}
          <div className="lg:col-span-5 relative">
            <div className="op-section p-6 space-y-4 shadow-sm relative overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3 font-mono text-xs text-[#5E6965]">
                <span className="flex items-center gap-2 font-bold text-[#17211F]">
                  <Compass className="w-4 h-4 text-[#176B63]" />
                  MARITIME TRADE LANE SIMULATOR
                </span>
                <span className="flex items-center gap-1 text-[#287A57]">
                  <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                </span>
              </div>

              {/* Restrained Animated SVG Trade Corridor Graph */}
              <div className="relative w-full h-[300px] rounded bg-[#F6F7F4] border border-[#D9DFDB] overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full p-4" viewBox="0 0 500 300" fill="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="50" x2="450" y2="50" stroke="#E2E8E5" strokeDasharray="4 4" />
                  <line x1="50" y1="150" x2="450" y2="150" stroke="#E2E8E5" strokeDasharray="4 4" />
                  <line x1="50" y1="250" x2="450" y2="250" stroke="#E2E8E5" strokeDasharray="4 4" />

                  {/* Route Paths */}
                  {/* Hay Point → Kamarajar */}
                  <path
                    d="M 80,80 Q 250,60 420,120"
                    stroke="#176B63"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    className="animate-[dash_20s_linear_infinite]"
                  />
                  {/* Newcastle → Paradip */}
                  <path
                    d="M 80,160 Q 240,140 420,190"
                    stroke="#C47A24"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    className="animate-[dash_25s_linear_infinite]"
                  />
                  {/* Richards Bay → Vizag */}
                  <path
                    d="M 80,240 Q 230,220 420,240"
                    stroke="#2F8279"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Origin Nodes */}
                  <g className="cursor-pointer">
                    <circle cx="80" cy="80" r="7" fill="#C47A24" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="75" y="62" fill="#17211F" fontSize="10" fontFamily="monospace" fontWeight="bold">Hay Point (AU)</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="80" cy="160" r="7" fill="#C47A24" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="75" y="142" fill="#17211F" fontSize="10" fontFamily="monospace" fontWeight="bold">Newcastle (AU)</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="80" cy="240" r="7" fill="#C47A24" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="75" y="222" fill="#17211F" fontSize="10" fontFamily="monospace" fontWeight="bold">Richards Bay (ZA)</text>
                  </g>

                  {/* Destination Nodes (East Coast India) */}
                  <g className="cursor-pointer">
                    <circle cx="420" cy="120" r="9" fill="#176B63" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="360" y="105" fill="#176B63" fontSize="11" fontFamily="monospace" fontWeight="bold">Kamarajar (IN)</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="420" cy="190" r="9" fill="#176B63" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="375" y="175" fill="#176B63" fontSize="11" fontFamily="monospace" fontWeight="bold">Paradip (IN)</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="420" cy="240" r="9" fill="#176B63" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="385" y="225" fill="#176B63" fontSize="11" fontFamily="monospace" fontWeight="bold">Vizag (IN)</text>
                  </g>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#5E6965] border-t border-[#D9DFDB] pt-2">
                <span>Voyage Distance: 6,520 NM</span>
                <span>Optimized Laycan Windows</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
