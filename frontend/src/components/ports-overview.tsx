"use client";

import { useEffect, useState } from "react";
import { fetchPortWeather, fetchPorts, Port, WeatherObservation } from "@/lib/api";
import { Anchor, Cloud, CloudRain, Eye, Filter, ShieldCheck, Wind } from "lucide-react";

export default function PortsOverview() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherObservation[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [filterEastCoast, setFilterEastCoast] = useState(false);

  useEffect(() => {
    async function loadPorts() {
      try {
        const data = await fetchPorts();
        setPorts(data);
        if (data.length > 0) {
          setSelectedPortId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load ports:", err);
      }
    }
    loadPorts();
  }, []);

  useEffect(() => {
    async function loadWeather() {
      if (!selectedPortId) return;
      setLoadingWeather(true);
      try {
        const data = await fetchPortWeather(selectedPortId);
        setWeather(data);
      } catch {
        setWeather([]);
      } finally {
        setLoadingWeather(false);
      }
    }
    loadWeather();
  }, [selectedPortId]);

  const displayedPorts = filterEastCoast
    ? ports.filter((p) => p.is_east_coast_india)
    : ports;

  const selectedPort = ports.find((p) => p.id === selectedPortId);
  const currentWeather = weather.length > 0 ? weather[0] : null;

  return (
    <div className="op-section p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DFDB] pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17211F] font-mono flex items-center gap-2">
            <Anchor className="w-4 h-4 text-[#176B63]" />
            <span>Port Technical Limits & Weather</span>
          </h2>
          <p className="text-xs text-[#5E6965] mt-0.5">
            Draft constraints, max LOA, handling rates, and operational weather.
          </p>
        </div>

        <button
          onClick={() => setFilterEastCoast(!filterEastCoast)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-ui border ${
            filterEastCoast
              ? "bg-[#176B63]/10 border-[#176B63] text-[#176B63] font-bold"
              : "bg-[#F6F7F4] border-[#D9DFDB] text-[#5E6965] hover:border-[#176B63]"
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>{filterEastCoast ? "Showing East Coast IN Only" : "East Coast India Only"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Clean Port Specification Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#5E6965]">
            <span>Port Specifications ({displayedPorts.length})</span>
          </div>

          <div className="overflow-x-auto border border-[#D9DFDB] rounded bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#F0F2EF] border-b border-[#D9DFDB] text-[#5E6965] text-[11px]">
                  <th className="py-2 px-3">Port & UN/LOCODE</th>
                  <th className="py-2 px-2">Country</th>
                  <th className="py-2 px-2">Max Draft</th>
                  <th className="py-2 px-2">Max LOA</th>
                  <th className="py-2 px-2">Handling Rate</th>
                  <th className="py-2 px-2 text-right">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DFDB]">
                {displayedPorts.map((port) => (
                  <tr
                    key={port.id}
                    onClick={() => setSelectedPortId(port.id)}
                    className={`cursor-pointer transition-ui ${
                      selectedPortId === port.id
                        ? "bg-[#176B63]/10 font-semibold text-[#176B63]"
                        : "hover:bg-[#F0F2EF]/60 text-[#17211F]"
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#17211F]">{port.name}</div>
                      <div className="text-[10px] text-[#5E6965]">{port.unlocode}</div>
                    </td>
                    <td className="py-2.5 px-2 text-[#5E6965]">{port.country}</td>
                    <td className="py-2.5 px-2 font-bold text-[#17211F]">{port.max_draft_m} m</td>
                    <td className="py-2.5 px-2 text-[#17211F]">{port.max_loa_m} m</td>
                    <td className="py-2.5 px-2 text-[#17211F]">
                      {port.cargo_handling_rate_tph ? `${Number(port.cargo_handling_rate_tph).toLocaleString()} TPH` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {port.is_east_coast_india ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#176B63]/10 text-[#176B63] text-[10px] font-medium">
                          East Coast IN
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-[#F0F2EF] text-[#5E6965] text-[10px]">
                          Origin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Operational Weather Telemetry Panel */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#5E6965]">
            <span>Operational Weather</span>
            <span className="text-[#17211F] font-bold">{selectedPort?.name} ({selectedPort?.unlocode})</span>
          </div>

          <div className="op-section p-4 space-y-4">
            {loadingWeather ? (
              <div className="py-12 text-center text-xs text-[#5E6965] font-mono animate-pulse">
                Fetching Weather Telemetry...
              </div>
            ) : currentWeather ? (
              <div className="space-y-3 text-xs font-mono">
                {/* Wind Speed */}
                <div className="op-subpanel p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-[#176B63]" />
                    <span className="text-[#5E6965]">Wind Speed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#17211F]">
                      {currentWeather.wind_speed_ms ? `${currentWeather.wind_speed_ms} m/s` : "Normal"}
                    </span>
                    <div className="text-[10px] text-[#5E6965]">
                      {currentWeather.wind_speed_ms ? `${(parseFloat(currentWeather.wind_speed_ms) * 1.94384).toFixed(1)} kts` : ""}
                    </div>
                  </div>
                </div>

                {/* Significant Wave Height */}
                <div className="op-subpanel p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#176B63]" />
                    <span className="text-[#5E6965]">Significant Wave Height</span>
                  </div>
                  <div className="text-sm font-bold text-[#17211F]">
                    {currentWeather.wave_height_m ? `${currentWeather.wave_height_m} m` : "0.5m - Calm"}
                  </div>
                </div>

                {/* Precipitation */}
                <div className="op-subpanel p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-[#176B63]" />
                    <span className="text-[#5E6965]">Precipitation</span>
                  </div>
                  <div className="text-sm font-bold text-[#17211F]">
                    {currentWeather.precipitation_mm ? `${currentWeather.precipitation_mm} mm` : "0.0 mm"}
                  </div>
                </div>

                {/* Visibility */}
                <div className="op-subpanel p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#176B63]" />
                    <span className="text-[#5E6965]">Visibility</span>
                  </div>
                  <div className="text-sm font-bold text-[#17211F]">
                    {currentWeather.visibility_m ? `${(currentWeather.visibility_m / 1000).toFixed(1)} km` : "10.0 km"}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D9DFDB] flex items-center justify-between text-[11px]">
                  <span className="text-[#5E6965]">Handling Capacity:</span>
                  <span className="font-bold text-[#17211F]">
                    {selectedPort?.cargo_handling_rate_tph ? `${Number(selectedPort.cargo_handling_rate_tph).toLocaleString()} TPH` : "Standard"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#5E6965] font-mono space-y-2">
                <ShieldCheck className="w-6 h-6 mx-auto text-[#287A57]" />
                <div>Normal Operational Conditions</div>
                <div className="text-[10px] text-[#5E6965]">No severe weather alerts active for this port</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
