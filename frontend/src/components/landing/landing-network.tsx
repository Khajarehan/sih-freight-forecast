"use client";

import { Anchor, Compass, MapPin } from "lucide-react";

export default function LandingNetwork() {
  const routes = [
    {
      origin: "Newcastle (AUNTL)",
      originCountry: "Australia",
      dest: "Paradip Port (INPRT)",
      destCountry: "East Coast India",
      dist: "6,520 NM",
      cargo: "Thermal & Coking Coal",
    },
    {
      origin: "Hay Point (AUHPT)",
      originCountry: "Australia",
      dest: "Kamarajar Port (INENR)",
      destCountry: "East Coast India",
      dist: "5,840 NM",
      cargo: "Metallurgical Coal",
    },
    {
      origin: "Richards Bay (ZARBY)",
      originCountry: "South Africa",
      dest: "Visakhapatnam (INVTZ)",
      destCountry: "East Coast India",
      dist: "4,680 NM",
      cargo: "High-Grade Steam Coal",
    },
  ];

  return (
    <section id="corridors" className="py-20 bg-white border-b border-[#D9DFDB]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B63] font-mono">
              Trade Corridors
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] tracking-tight">
              Global Export Hubs to East Coast India
            </h2>
            <p className="text-sm text-[#5E6965]">
              Real-time monitoring and charter cost evaluation across key dry bulk shipping lanes.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded bg-[#F6F7F4] border border-[#D9DFDB] text-xs font-mono text-[#17211F]">
            <Compass className="w-4 h-4 text-[#176B63] inline mr-1.5" />
            <span>3 Primary Shipping Lanes</span>
          </div>
        </div>

        {/* Route Corridor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routes.map((rt, idx) => (
            <div key={idx} className="op-section p-6 space-y-4 hover:border-[#176B63] transition-ui">
              <div className="flex items-center justify-between text-xs font-mono text-[#5E6965] border-b border-[#D9DFDB] pb-3">
                <span className="flex items-center gap-1.5 font-bold text-[#C47A24]">
                  <MapPin className="w-3.5 h-3.5" /> {rt.originCountry}
                </span>
                <span className="font-bold text-[#176B63]">{rt.dist}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#5E6965]">Origin Loading Port</div>
                  <div className="text-sm font-bold text-[#17211F]">{rt.origin}</div>
                </div>

                <div className="flex items-center gap-2 text-[#176B63] font-mono text-xs">
                  <div className="h-px bg-[#D9DFDB] flex-1" />
                  <span>→</span>
                  <div className="h-px bg-[#D9DFDB] flex-1" />
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono text-[#5E6965]">Destination Discharge Port</div>
                  <div className="text-sm font-bold text-[#17211F] flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-[#176B63]" />
                    <span>{rt.dest}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D9DFDB] text-[11px] font-mono text-[#5E6965] flex justify-between">
                <span>Commodity:</span>
                <span className="text-[#17211F] font-medium">{rt.cargo}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
