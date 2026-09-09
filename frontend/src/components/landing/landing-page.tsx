"use client";

import LandingNav from "./landing-nav";
import LandingHero from "./landing-hero";
import LandingCapabilities from "./landing-capabilities";
import LandingFlow from "./landing-flow";
import LandingNetwork from "./landing-network";
import LandingPreview from "./landing-preview";
import LandingCTA from "./landing-cta";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F4] text-[#17211F] antialiased selection:bg-[#176B63] selection:text-white">
      {/* Top Header */}
      <LandingNav />

      {/* Main Content Sections */}
      <main className="flex-1">
        <LandingHero />
        <LandingCapabilities />
        <LandingFlow />
        <LandingNetwork />
        <LandingPreview />
        <LandingCTA />
      </main>

      {/* Landing Footer */}
      <footer className="bg-white border-t border-[#D9DFDB] py-6 text-xs text-[#5E6965]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17211F]">MARITIME FREIGHT INTELLIGENCE</span>
            <span className="text-[11px] font-mono text-[#5E6965]">SIH-26006</span>
          </div>

          <div className="text-[11px] font-mono text-[#5E6965]">
            Mapbox GL JS • OR-Tools CP-SAT • Linear Trend ML • FastAPI • PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  );
}
