export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type Health = {
  status: string;
  service: string;
  environment: string;
  database: string;
};

export async function fetchHealth(): Promise<Health> {
  const response = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`);
  }

  return (await response.json()) as Health;
}
