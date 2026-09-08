"use client";

import { useEffect, useState } from "react";
import { Port, WeatherObservation, fetchPorts, fetchPortWeather } from "@/lib/api";
import {
  Anchor,
  CloudRain,
  Wind,
  Waves,
  Eye,
  CheckCircle2,
  MapPin,
  Filter,
  RefreshCw,
  Gauge,
} from "lucide-react";

export default function PortsOverview() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [eastCoastOnly, setEastCoastOnly] = useState(false);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherObservation[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ports
  useEffect(() => {
    async function loadPorts() {
      setError(null);
      try {
        const data = await fetchPorts(eastCoastOnly);
        setPorts(data);
        if (data.length > 0) {
          // Default selection to first East Coast India port if available
          const eastCoastPort = data.find((p) => p.is_east_coast_india);
          setSelectedPortId(eastCoastPort ? eastCoastPort.id : data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ports");
      }
    }
    loadPorts();
  }, [eastCoastOnly]);

  // Load weather for selected port
  useEffect(() => {
    if (selectedPortId === null) return;
    const portId = selectedPortId;
    async function loadWeather() {
      setLoadingWeather(true);
      try {
        const data = await fetchPortWeather(portId, 10);
        setWeather(data);
      } catch {
        // Port might not have weather (e.g. origin ports)
        setWeather([]);
      } finally {
        setLoadingWeather(false);
      }
    }
    loadWeather();
  }, [selectedPortId]);

  const selectedPort = ports.find((p) => p.id === selectedPortId);
  const latestWeather = weather.length > 0 ? weather[0] : null;

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Global & East Coast India Ports</h2>
            <p className="text-xs text-slate-400">
              Technical port limits, draft constraints, and live weather monitoring
            </p>
          </div>
        </div>

        <button
          onClick={() => setEastCoastOnly(!eastCoastOnly)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            eastCoastOnly
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-400 shadow-md shadow-emerald-500/10"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>East Coast India Only</span>
          {eastCoastOnly && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Ports Table & Selected Port Weather Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ports Directory List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Port Specifications ({ports.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                  <th className="pb-3">Port & Code</th>
                  <th className="pb-3">Country</th>
                  <th className="pb-3">Max Draft</th>
                  <th className="pb-3">Max LOA</th>
                  <th className="pb-3">Cargo TPH</th>
                  <th className="pb-3 text-right">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ports.map((port) => (
                  <tr
                    key={port.id}
                    onClick={() => setSelectedPortId(port.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedPortId === port.id
                        ? "bg-emerald-950/30 text-emerald-300 font-medium"
                        : "hover:bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-white">{port.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{port.unlocode}</div>
                    </td>
                    <td className="py-3 font-mono">{port.country}</td>
                    <td className="py-3">
                      {port.max_draft_m ? `${parseFloat(port.max_draft_m).toFixed(1)} m` : "—"}
                    </td>
                    <td className="py-3">
                      {port.max_loa_m ? `${parseFloat(port.max_loa_m).toFixed(0)} m` : "—"}
                    </td>
                    <td className="py-3">
                      {port.cargo_handling_rate_tph
                        ? `${parseFloat(port.cargo_handling_rate_tph).toLocaleString()} t/h`
                        : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {port.is_east_coast_india ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400">
                          East Coast IN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
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

        {/* Selected Port Weather Widget */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-cyan-400" /> Port Weather Monitor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedPort ? `${selectedPort.name} (${selectedPort.unlocode})` : "Select a port"}
                </p>
              </div>
              {loadingWeather && (
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
            </div>

            {selectedPort ? (
              latestWeather ? (
                <div className="space-y-3">
                  <div className="glass-card rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wind className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs text-slate-400">Wind Speed</div>
                        <div className="text-sm font-bold text-white">
                          {parseFloat(latestWeather.wind_speed_ms).toFixed(1)} m/s
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {(parseFloat(latestWeather.wind_speed_ms) * 1.94384).toFixed(1)} knots
                    </span>
                  </div>

                  <div className="glass-card rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Waves className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-xs text-slate-400">Significant Wave Height</div>
                        <div className="text-sm font-bold text-white">
                          {parseFloat(latestWeather.wave_height_m).toFixed(2)} m
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CloudRain className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-xs text-slate-400">Precipitation</div>
                        <div className="text-sm font-bold text-white">
                          {parseFloat(latestWeather.precipitation_mm).toFixed(1)} mm
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs text-slate-400">Visibility</div>
                        <div className="text-sm font-bold text-white">
                          {(latestWeather.visibility_m / 1000).toFixed(1)} km
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 text-right">
                    Observed: {new Date(latestWeather.ts).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No weather observations registered for {selectedPort.name} (Origin Port).
                </div>
              )
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a port from the table to view weather observations.
              </div>
            )}
          </div>

          {selectedPort && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Handling Capacity:
              </span>
              <span className="font-semibold text-white font-mono">
                {selectedPort.cargo_handling_rate_tph
                  ? `${parseFloat(selectedPort.cargo_handling_rate_tph).toLocaleString()} TPH`
                  : "N/A"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
