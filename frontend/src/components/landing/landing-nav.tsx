"use client";

import Link from "next/link";
import { Ship, ArrowRight } from "lucide-react";

export default function LandingNav() {
  return (
    <header className="bg-[#F6F7F4]/90 backdrop-blur-md border-b border-[#D9DFDB] sticky top-0 z-50 select-none">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Identifier */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-[#176B63] text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
            <Ship className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#17211F] tracking-tight flex items-center gap-2">
              <span>MARITIME FREIGHT INTELLIGENCE</span>
              <span className="px-1.5 py-0.5 rounded bg-[#E2E8E5] text-[#176B63] text-[10px] font-mono font-medium">
                SIH-26006
              </span>
            </div>
            <div className="text-[10px] text-[#5E6965] font-mono">
              East Coast India Bulk Procurement & Chartering Platform
            </div>
          </div>
        </Link>

        {/* Section Jump Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#5E6965]">
          <a href="#capabilities" className="hover:text-[#176B63] transition-colors">
            Capabilities
          </a>
          <a href="#flow" className="hover:text-[#176B63] transition-colors">
            Platform Flow
          </a>
          <a href="#corridors" className="hover:text-[#176B63] transition-colors">
            Trade Corridors
          </a>
          <a href="#preview" className="hover:text-[#176B63] transition-colors">
            Live Indicators
          </a>
        </nav>

        {/* Primary CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/platform"
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#176B63] hover:bg-[#12544E] text-white font-bold text-xs transition-ui shadow-sm group"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
