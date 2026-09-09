"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ship,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  Scale,
  TrendingUp,
  Activity,
  BarChart3,
  Anchor,
} from "lucide-react";
import { fetchHealth, type Health } from "@/lib/api";

export type NavTab = "overview" | "optimizer" | "forecast" | "routes" | "baltic" | "ports";

type NavbarProps = {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
};

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Compass },
    { id: "optimizer", label: "Charter Optimizer", icon: Scale },
    { id: "forecast", label: "Freight Forecast", icon: TrendingUp },
    { id: "routes", label: "Freight Rates", icon: Activity },
    { id: "baltic", label: "Baltic Indices", icon: BarChart3 },
    { id: "ports", label: "Ports & Weather", icon: Anchor },
  ];

  return (
    <header className="bg-white border-b border-[#D9DFDB] sticky top-0 z-40 select-none shadow-sm">
      {/* Top Utility Context Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs border-b border-[#F0F2EF]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded bg-[#176B63]/10 text-[#176B63] flex items-center justify-center font-bold">
              <Ship className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[#17211F] tracking-tight">
              MARITIME FREIGHT INTELLIGENCE
            </span>
            <span className="text-[11px] text-[#5E6965] font-mono">SIH-26006</span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F0F2EF] border border-[#D9DFDB] text-[11px] text-[#5E6965]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#287A57]"></span>
            <span>East Coast India Bulk Procurement</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {/* Live UTC Clock */}
          <div className="hidden lg:block font-mono text-[#5E6965]">
            {currentTime}
          </div>

          {/* Database Health Status */}
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#F6F7F4] border border-[#D9DFDB]">
            <Database className="w-3 h-3 text-[#5E6965]" />
            {loading ? (
              <span className="text-[#5E6965] animate-pulse">Checking System...</span>
            ) : error ? (
              <span className="text-[#B94A48] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3 h-3 text-[#287A57]" />
                <span className="text-[#287A57] font-semibold">ONLINE</span>
                <span className="text-[#D9DFDB]">|</span>
                <span className="text-[#17211F]">
                  {health?.database === "connected" ? "PostgreSQL" : health?.database}
                </span>
              </span>
            )}
          </div>

          <button
            onClick={loadHealth}
            disabled={loading}
            className="p-1 rounded bg-[#F0F2EF] hover:bg-[#D9DFDB] text-[#5E6965] hover:text-[#17211F] transition-ui"
            title="Refresh System Health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#176B63]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-ui border-b-2 ${
                  isActive
                    ? "border-[#176B63] text-[#176B63] bg-[#F6F7F4]/60 font-bold"
                    : "border-transparent text-[#5E6965] hover:text-[#17211F] hover:bg-[#F0F2EF]/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#176B63]" : "text-[#5E6965]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
