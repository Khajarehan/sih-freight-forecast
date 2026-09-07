"use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
    >
      Re-check
    </button>
  );
}
