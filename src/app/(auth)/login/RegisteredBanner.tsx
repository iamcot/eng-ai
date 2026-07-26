"use client";

import { useSearchParams } from "next/navigation";

export function RegisteredBanner() {
  const params = useSearchParams();
  if (!params.get("registered")) return null;
  return (
    <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
      Account created! Please sign in.
    </div>
  );
}
