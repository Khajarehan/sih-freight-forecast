export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type Health = {
  status: string;
  service: string;
  environment: string;
  database: string;
};

export type Port = {
  id: number;
  unlocode: string;
  name: string;
  country: string;
  latitude: string;
  longitude: string;
  max_loa_m: string | null;
  max_beam_m: string | null;
  max_draft_m: string | null;
  cargo_handling_rate_tph: string | null;
  is_east_coast_india: boolean;
};

export type RoutePort = {
  id: number;
  unlocode: string;
  name: string;
  country: string;
};

export type Route = {
  id: number;
  origin_port_id: number;
  destination_port_id: number;
  distance_nm: string;
  origin_port: RoutePort;
  destination_port: RoutePort;
};

export type FreightRate = {
  route_id: number;
  vessel_type_id: number;
  rate_basis: string;
  ts: string;
  rate_value: string;
};

export type BalticIndex = {
  index_code: string;
  ts: string;
  value: string;
};

export type WeatherObservation = {
  port_id: number;
  ts: string;
  wind_speed_ms: string;
  wave_height_m: string;
  precipitation_mm: string;
  visibility_m: number;
};

// Phase 6 Forecast API Types
export type ForecastRunRequest = {
  route_id: number;
  vessel_type_id: number;
  horizon_days: number;
};

export type ForecastPoint = {
  id: number;
  forecast_run_id: number;
  target_ts: string;
  predicted_value: string;
  p10: string | null;
  p50: string | null;
  p90: string | null;
};

export type ForecastRunResponse = {
  id: number;
  route_id: number;
  vessel_type_id: number;
  horizon_days?: number;
  model_name?: string;
  model_version: string;
  status: string;
  requested_at?: string;
  completed_at?: string | null;
  points?: ForecastPoint[];
  forecast_points?: ForecastPoint[];
};

// Phase 7 Optimization API Types
export type OptimizationRequest = {
  route_id: number;
  cargo_quantity_t: number;
  laycan_start: string;
  laycan_end: string;
  candidate_vessel_type_ids?: number[] | null;
};

export type EvaluatedCandidate = {
  vessel_type_id: number;
  vessel_type_code: string;
  vessel_type_name: string;
  is_feasible: boolean;
  infeasibility_reasons: string[];
  best_charter_date?: string | null;
  best_rate_usd_per_t?: string | number | null;
  best_total_cost_usd?: string | number | null;
};

export type OptimalSolution = {
  vessel_type_id: number;
  vessel_type_code: string;
  vessel_type_name: string;
  charter_date: string;
  predicted_rate_usd_per_t: string | number;
  total_freight_cost_usd: string | number;
  estimated_loading_days: string | number;
  estimated_discharging_days: string | number;
  loading_tph_used: string | number;
  discharging_tph_used: string | number;
  is_origin_tph_fallback: boolean;
  is_destination_tph_fallback: boolean;
};

export type OptimizationResponse = {
  status: "OPTIMAL" | "INFEASIBLE";
  optimal_solution?: OptimalSolution | null;
  evaluated_candidates: EvaluatedCandidate[];
  message: string;
};

// API Fetch Functions
export async function fetchHealth(): Promise<Health> {
  const response = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Backend health check failed with status ${response.status}`);
  }
  return (await response.json()) as Health;
}

export async function fetchRoutes(): Promise<Route[]> {
  const response = await fetch(`${API_BASE_URL}/routes`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.statusText}`);
  }
  return (await response.json()) as Route[];
}

export async function fetchRouteRates(
  routeId: number,
  vesselTypeCode?: string,
  limit: number = 500
): Promise<FreightRate[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (vesselTypeCode) {
    params.append("vessel_type_code", vesselTypeCode);
  }
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/rates?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch rates for route ${routeId}: ${response.statusText}`);
  }
  return (await response.json()) as FreightRate[];
}

export async function fetchBalticIndices(
  indexCode?: string,
  limit: number = 500
): Promise<BalticIndex[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (indexCode) {
    params.append("index_code", indexCode);
  }
  const response = await fetch(`${API_BASE_URL}/baltic-indices?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Baltic indices: ${response.statusText}`);
  }
  return (await response.json()) as BalticIndex[];
}

export async function fetchPorts(eastCoastOnly: boolean = false): Promise<Port[]> {
  const params = new URLSearchParams();
  if (eastCoastOnly) {
    params.append("east_coast_only", "true");
  }
  const url = `${API_BASE_URL}/ports${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ports: ${response.statusText}`);
  }
  return (await response.json()) as Port[];
}

export async function fetchPortWeather(
  portId: number,
  limit: number = 100
): Promise<WeatherObservation[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${API_BASE_URL}/ports/${portId}/weather?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch weather for port ${portId}: ${response.statusText}`);
  }
  return (await response.json()) as WeatherObservation[];
}

export async function runForecast(body: ForecastRunRequest): Promise<ForecastRunResponse> {
  const response = await fetch(`${API_BASE_URL}/forecasts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.detail || `Forecast generation failed with status ${response.status}`);
  }
  return (await response.json()) as ForecastRunResponse;
}

export async function runOptimization(body: OptimizationRequest): Promise<OptimizationResponse> {
  const response = await fetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.detail || `Optimization run failed with status ${response.status}`);
  }
  return (await response.json()) as OptimizationResponse;
}
