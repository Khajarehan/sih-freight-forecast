"use client";

import Link from "next/link";
import { ArrowRight, Ship } from "lucide-react";

export default function LandingCTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="op-section p-12 max-w-3xl mx-auto space-y-6 bg-[#F6F7F4] shadow-sm">
          
          <div className="w-12 h-12 rounded bg-[#176B63] text-white flex items-center justify-center font-bold mx-auto shadow-sm">
            <Ship className="w-6 h-6" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight">
              Ready to Enter the Freight Intelligence Command Center?
            </h2>
            <p className="text-sm text-[#5E6965] max-w-xl mx-auto leading-relaxed">
              Access real-time freight rate forecasting, vessel charter cost optimization, Baltic index tracking, and port weather monitoring in a single unified workstation.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/platform"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-bold text-sm transition-ui shadow-md group"
            >
              <span>ENTER PLATFORM NOW</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="text-[11px] font-mono text-[#5E6965]">
            SIH-26006 • East Coast India Bulk Procurement Workstation
          </div>

        </div>
      </div>
    </section>
  );
}
