import RefreshButton from "@/components/refresh-button";
import { API_BASE_URL, fetchHealth, type Health } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  let health: Health | null = null;
  let error: string | null = null;

  try {
    health = await fetchHealth();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unknown error";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Freight Forecasting Platform</h1>
        <p className="text-sm text-zinc-500">
          Phase 1 foundation — backend connectivity check
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">API base URL: {API_BASE_URL}</p>

        {error && <p className="mt-4 text-red-600">Backend unreachable: {error}</p>}

        {health && (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-zinc-500">Status</dt>
            <dd>{health.status}</dd>
            <dt className="text-zinc-500">Service</dt>
            <dd>{health.service}</dd>
            <dt className="text-zinc-500">Environment</dt>
            <dd>{health.environment}</dd>
            <dt className="text-zinc-500">Database</dt>
            <dd>{health.database}</dd>
          </dl>
        )}

        <RefreshButton />
      </section>
    </main>
  );
}
