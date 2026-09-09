"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPorts, fetchRoutes, Port, Route } from "@/lib/api";
import { Anchor, Compass, MapPin, Navigation, ShieldCheck } from "lucide-react";

export default function MapboxShippingMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [vectorFallback, setVectorFallback] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [portsData, routesData] = await Promise.all([
          fetchPorts(),
          fetchRoutes(),
        ]);
        setPorts(portsData);
        setRoutes(routesData);
      } catch (err) {
        console.error("Failed to load map data:", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || ports.length === 0) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken || mapboxToken.includes("placeholder")) {
      setVectorFallback(true);
      return;
    }

    let map: { remove: () => void } | null = null;

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = mapboxToken;

      try {
        const instance = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [80.0, 10.0],
          zoom: 3.2,
        });
        map = instance;

        instance.on("load", () => {
          ports.forEach((port) => {
            const isEastCoast = port.is_east_coast_india;
            const el = document.createElement("div");
            el.className = "custom-map-marker";
            el.style.width = isEastCoast ? "22px" : "18px";
            el.style.height = isEastCoast ? "22px" : "18px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = isEastCoast ? "#176B63" : "#C47A24";
            el.style.border = "2px solid #FFFFFF";
            el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
            el.style.cursor = "pointer";

            el.addEventListener("click", () => {
              setSelectedPort(port);
            });

            new mapboxgl.default.Marker(el)
              .setLngLat([parseFloat(port.longitude), parseFloat(port.latitude)])
              .addTo(instance);
          });
        });
      } catch (err) {
        console.error("Mapbox init error:", err);
        setVectorFallback(true);
      }
    });

    return () => {
      if (map) map.remove();
    };
  }, [ports]);

  return (
    <div className="op-section p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#D9DFDB] pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17211F] font-mono flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#176B63]" />
            <span>Maritime Route Network GIS</span>
          </h2>
          <p className="text-xs text-[#5E6965] mt-0.5">
            Bulk trade corridors connecting global export hubs to East Coast India.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#5E6965]">
          <span className="px-2 py-0.5 rounded bg-[#F0F2EF] border border-[#D9DFDB] text-[#17211F]">
            {vectorFallback ? "Vector Mode" : "Mapbox Mode"}
          </span>
          <span>{ports.length} Ports • {routes.length} Corridors</span>
        </div>
      </div>

      {/* Map Canvas / Vector Fallback Container */}
      <div className="relative w-full h-[420px] rounded border border-[#D9DFDB] overflow-hidden bg-[#F6F7F4]">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Vector Network Diagram Fallback */}
        {vectorFallback && (
          <div className="absolute inset-0 p-5 bg-[#F6F7F4] flex flex-col justify-between select-none">
            <div className="flex items-center justify-between text-xs font-mono text-[#5E6965] border-b border-[#D9DFDB] pb-2">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#176B63]" />
                Indian Ocean & Bay of Bengal Maritime Network
              </span>
              <span>Vector GIS Representation</span>
            </div>

            {/* Ports Schema Grid */}
            <div className="grid grid-cols-2 gap-6 my-auto">
              {/* Origin Ports */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C47A24] font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C47A24]" />
                  <span>Loading Ports (Origin)</span>
                </div>
                <div className="space-y-2">
                  {ports
                    .filter((p) => !p.is_east_coast_india)
                    .map((port) => (
                      <div
                        key={port.id}
                        onClick={() => setSelectedPort(port)}
                        className={`op-subpanel p-3 text-xs cursor-pointer transition-ui flex items-center justify-between ${
                          selectedPort?.id === port.id
                            ? "bg-[#C47A24]/10 border-[#C47A24] text-[#C47A24] font-bold"
                            : "hover:bg-[#F0F2EF] text-[#17211F]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#C47A24] text-white text-[10px] font-bold">
                            {port.country}
                          </span>
                          <div>
                            <div className="font-bold">{port.name}</div>
                            <div className="text-[10px] text-[#5E6965] font-mono">{port.unlocode}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#5E6965] font-mono">
                          Max Draft: {port.max_draft_m}m
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Destination Ports */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#176B63] font-mono flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-[#176B63]" />
                  <span>Destination Ports (East Coast India)</span>
                </div>
                <div className="space-y-2">
                  {ports
                    .filter((p) => p.is_east_coast_india)
                    .map((port) => (
                      <div
                        key={port.id}
                        onClick={() => setSelectedPort(port)}
                        className={`op-subpanel p-3 text-xs cursor-pointer transition-ui flex items-center justify-between ${
                          selectedPort?.id === port.id
                            ? "bg-[#176B63]/10 border-[#176B63] text-[#176B63] font-bold"
                            : "hover:bg-[#F0F2EF] text-[#17211F]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#176B63] text-white text-[10px] font-bold">
                            IN
                          </span>
                          <div>
                            <div className="font-bold">{port.name}</div>
                            <div className="text-[10px] text-[#5E6965] font-mono">{port.unlocode}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#5E6965] font-mono">
                          Max Draft: {port.max_draft_m}m
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#5E6965] font-mono border-t border-[#D9DFDB] pt-2 flex items-center justify-between">
              <span>Primary Corridors: Hay Point → Kamarajar | Newcastle → Paradip | Richards Bay → Vizag</span>
              <span className="flex items-center gap-1 text-[#287A57]">
                <ShieldCheck className="w-3 h-3" /> All Corridors Active
              </span>
            </div>
          </div>
        )}

        {/* Selected Port Inspector Drawer */}
        {selectedPort && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[#D9DFDB] rounded p-3 text-xs font-mono text-[#17211F] shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-[#176B63]/10 text-[#176B63] flex items-center justify-center font-bold">
                <Anchor className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold">{selectedPort.name}</span>{" "}
                <span className="text-[#5E6965]">({selectedPort.unlocode})</span>
                <div className="text-[10px] text-[#5E6965]">
                  Coordinates: {selectedPort.latitude}, {selectedPort.longitude}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-[#5E6965]">Max Draft:</span>{" "}
                <span className="font-bold">{selectedPort.max_draft_m}m</span>
              </div>
              <div>
                <span className="text-[#5E6965]">Max LOA:</span>{" "}
                <span className="font-bold">{selectedPort.max_loa_m}m</span>
              </div>
              <div>
                <span className="text-[#5E6965]">Handling:</span>{" "}
                <span className="font-bold">
                  {selectedPort.cargo_handling_rate_tph ? `${Number(selectedPort.cargo_handling_rate_tph).toLocaleString()} TPH` : "—"}
                </span>
              </div>
              <button
                onClick={() => setSelectedPort(null)}
                className="px-2 py-0.5 rounded bg-[#F0F2EF] hover:bg-[#D9DFDB] text-[#5E6965] text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
