"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck } from "lucide-react";

export default function LandingPreview() {
  return (
    <section id="preview" className="py-20 bg-[#F6F7F4] border-b border-[#D9DFDB]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B63] font-mono">
            Platform Intelligence Preview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] tracking-tight">
            Real-Time Market Indicators & Benchmarks
          </h2>
          <p className="text-sm text-[#5E6965]">
            Access live Baltic Exchange index feeds, spot charter freight rates, and operational port conditions inside the command center.
          </p>
        </div>

        {/* Intelligence Preview Box */}
        <div className="op-section p-6 space-y-6 bg-white max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3 text-xs font-mono">
            <span className="flex items-center gap-2 font-bold text-[#17211F]">
              <BarChart3 className="w-4 h-4 text-[#176B63]" />
              COMMAND CENTER METRICS SNAPSHOT
            </span>
            <span className="text-[#287A57] flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> POSTGRESQL CONNECTED
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#D9DFDB]">
            <div className="pt-2 md:pt-0 md:px-3 space-y-1">
              <div className="text-xs text-[#5E6965]">BCI (Capesize)</div>
              <div className="text-xl font-bold text-[#17211F] font-mono">
                1,335 <span className="text-xs font-normal text-[#287A57]">+1.2%</span>
              </div>
              <div className="text-[11px] text-[#5E6965]">Baltic Capesize Benchmark</div>
            </div>

            <div className="pt-2 md:pt-0 md:px-3 space-y-1">
              <div className="text-xs text-[#5E6965]">BPI (Panamax)</div>
              <div className="text-xl font-bold text-[#17211F] font-mono">
                1,268 <span className="text-xs font-normal text-[#5E6965]">0.0%</span>
              </div>
              <div className="text-[11px] text-[#5E6965]">Baltic Panamax Benchmark</div>
            </div>

            <div className="pt-2 md:pt-0 md:px-3 space-y-1">
              <div className="text-xs text-[#5E6965]">Spot Freight Rate</div>
              <div className="text-xl font-bold text-[#C47A24] font-mono">
                $13.60 <span className="text-xs font-normal text-[#5E6965]">/ t</span>
              </div>
              <div className="text-[11px] text-[#5E6965]">Hay Point → Kamarajar Route</div>
            </div>

            <div className="pt-2 md:pt-0 md:px-3 space-y-1">
              <div className="text-xs text-[#5E6965]">Operational Ports</div>
              <div className="text-xl font-bold text-[#17211F] font-mono">
                6 Active <span className="text-xs font-normal text-[#287A57]">Normal</span>
              </div>
              <div className="text-[11px] text-[#5E6965]">East Coast India Ports</div>
            </div>
          </div>

          {/* Interactive Teaser CTA */}
          <div className="pt-4 border-t border-[#D9DFDB] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#5E6965]">
              Launch the full command center to run CP-SAT vessel optimization and ML rate forecasts.
            </div>

            <Link
              href="/platform"
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-bold text-xs transition-ui shadow-sm group shrink-0"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
