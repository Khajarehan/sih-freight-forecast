"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPorts, fetchRoutes, Port, Route } from "@/lib/api";
import { Anchor, Compass, Layers, MapPin, Navigation, Ship } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Check if Mapbox token is provided & valid (not default placeholder)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const IS_VALID_TOKEN =
  Boolean(MAPBOX_TOKEN) &&
  MAPBOX_TOKEN !== "pk.eyJ1Ijoic2loLWZcmVpZ2h0IiwiYSI6ImNsd3Z6ZGVwMzAxdGYya3FzdzRhZ3c0OGkifQ.example_token_key" &&
  MAPBOX_TOKEN?.startsWith("pk.");

export default function MapboxShippingMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [ports, setPorts] = useState<Port[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(!IS_VALID_TOKEN);


  useEffect(() => {
    async function loadData() {
      try {
        const [portsData, routesData] = await Promise.all([
          fetchPorts(),
          fetchRoutes(),
        ]);
        setPorts(portsData);
        setRoutes(routesData);
        if (portsData.length > 0) {
          setSelectedPort(portsData.find((p) => p.is_east_coast_india) || portsData[0]);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (useFallback || loading || !mapContainerRef.current || ports.length === 0) {
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN || "";
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [85.0, 10.0], // Indian Ocean center
        zoom: 3.2,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        // Add Port Markers
        ports.forEach((port) => {
          const lat = parseFloat(port.latitude);
          const lng = parseFloat(port.longitude);
          if (isNaN(lat) || isNaN(lng)) return;

          const el = document.createElement("div");
          el.className = "custom-marker flex items-center justify-center cursor-pointer group";

          const isEastCoast = port.is_east_coast_india;
          const bgClass = isEastCoast
            ? "bg-cyan-500 text-slate-950 shadow-cyan-500/50"
            : "bg-amber-500 text-slate-950 shadow-amber-500/50";

          el.innerHTML = `
            <div class="w-8 h-8 rounded-full ${bgClass} flex items-center justify-center font-bold text-xs shadow-lg transform group-hover:scale-125 transition-transform border-2 border-slate-900">
              ${isEastCoast ? "IN" : port.country}
            </div>
          `;

          const popupContent = `
            <div class="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-xs space-y-2 min-w-[200px]">
              <div class="flex items-center justify-between font-bold text-sm text-cyan-400">
                <span>${port.name}</span>
                <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">${port.unlocode}</span>
              </div>
              <div class="space-y-1 text-slate-300 text-[11px]">
                <div>Max Draft: <span class="text-white font-mono">${port.max_draft_m ? `${port.max_draft_m}m` : "N/A"}</span></div>
                <div>Max LOA: <span class="text-white font-mono">${port.max_loa_m ? `${port.max_loa_m}m` : "N/A"}</span></div>
                <div>Max Beam: <span class="text-white font-mono">${port.max_beam_m ? `${port.max_beam_m}m` : "N/A"}</span></div>
                <div>Handling Rate: <span class="text-white font-mono">${port.cargo_handling_rate_tph ? `${port.cargo_handling_rate_tph} tph` : "2,000 tph (default)"}</span></div>
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent);

          new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener("click", () => {
            setSelectedPort(port);
          });
        });

        // Add Shipping Routes GeoJSON Arcs
        const routeFeatures = routes
          .map((rt) => {
            const originPort = ports.find((p) => p.id === rt.origin_port_id);
            const destPort = ports.find((p) => p.id === rt.destination_port_id);
            if (!originPort || !destPort) return null;

            const origLng = parseFloat(originPort.longitude);
            const origLat = parseFloat(originPort.latitude);
            const destLng = parseFloat(destPort.longitude);
            const destLat = parseFloat(destPort.latitude);

            return {
              type: "Feature" as const,
              properties: {
                id: rt.id,
                distance: rt.distance_nm,
                origin: originPort.name,
                destination: destPort.name,
              },
              geometry: {
                type: "LineString" as const,
                coordinates: [
                  [origLng, origLat],
                  [destLng, destLat],
                ],
              },
            };
          })
          .filter((f): f is NonNullable<typeof f> => f !== null);

        map.addSource("routes-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: routeFeatures,
          },
        });


        map.addLayer({
          id: "routes-layer",
          type: "line",
          source: "routes-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#06b6d4",
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": 0.7,
          },
        });
      });
    } catch (err) {
      console.warn("Mapbox initialization fallback triggered:", err);
      setUseFallback(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [useFallback, loading, ports, routes]);

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive Shipping Route & Maritime Network</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
                Mapbox GL JS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Bulk trade lanes into East Coast India (Paradip, Visakhapatnam, Ennore)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!IS_VALID_TOKEN && (
            <button
              onClick={() => setUseFallback(!useFallback)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
            >
              {useFallback ? "Vector Mode Active" : "Mapbox Mode Active"}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{ports.length} Ports • {routes.length} Trade Routes</span>
          </div>
        </div>
      </div>

      {/* Map Container Area */}
      <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3">
            <Ship className="w-8 h-8 text-cyan-400 animate-bounce" />
            <span className="text-xs font-mono text-slate-400">Loading maritime GIS layers...</span>
          </div>
        )}

        {!useFallback ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          /* Graceful Fallback Interactive Vector Map Representation */
          <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/80 p-6 flex flex-col justify-between overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Map Info Bar */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Maritime Trade Corridor Overview (Indian Ocean & Bay of Bengal)</span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Fallback GIS View (Token Pending)
              </div>
            </div>

            {/* Simulated Ocean & Route Vectors */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
              {/* Origin Ports Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Anchor className="w-3.5 h-3.5" /> Origin Loading Ports
                </div>
                <div className="space-y-2">
                  {ports.filter((p) => !p.is_east_coast_india).map((port) => (
                    <div
                      key={port.id}
                      onClick={() => setSelectedPort(port)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedPort?.id === port.id
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                            {port.country}
                          </div>
                          <div>
                            <div className="font-bold text-xs">{port.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{port.unlocode}</div>
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-400">
                          <div>Max Draft: {port.max_draft_m ? `${port.max_draft_m}m` : "N/A"}</div>
                          <div>LOA: {port.max_loa_m ? `${port.max_loa_m}m` : "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Ports Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Destination Ports (East Coast India)
                </div>
                <div className="space-y-2">
                  {ports.filter((p) => p.is_east_coast_india).map((port) => (
                    <div
                      key={port.id}
                      onClick={() => setSelectedPort(port)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedPort?.id === port.id
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                            IN
                          </div>
                          <div>
                            <div className="font-bold text-xs">{port.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{port.unlocode}</div>
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-400">
                          <div>Max Draft: {port.max_draft_m ? `${port.max_draft_m}m` : "N/A"}</div>
                          <div>LOA: {port.max_loa_m ? `${port.max_loa_m}m` : "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Port Inspection Drawer */}
        {selectedPort && (
          <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{selectedPort.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {selectedPort.unlocode}
                  </span>
                  {selectedPort.is_east_coast_india && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                      East Coast India
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-4 mt-1 font-mono">
                  <span>Draft: {selectedPort.max_draft_m ? `${selectedPort.max_draft_m}m` : "N/A"}</span>
                  <span>LOA: {selectedPort.max_loa_m ? `${selectedPort.max_loa_m}m` : "N/A"}</span>
                  <span>Beam: {selectedPort.max_beam_m ? `${selectedPort.max_beam_m}m` : "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Handling Capacity</div>
                <div className="font-bold text-cyan-400">
                  {selectedPort.cargo_handling_rate_tph
                    ? `${selectedPort.cargo_handling_rate_tph} TPH`
                    : "2,000 TPH (Default)"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Coordinates</div>
                <div className="text-slate-300">
                  {parseFloat(selectedPort.latitude).toFixed(2)}°, {parseFloat(selectedPort.longitude).toFixed(2)}°
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
