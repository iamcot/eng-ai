"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface Stats {
  totalInput: number;
  totalOutput: number;
  totalCost: number;
  totalCalls: number;
  byEndpoint: Record<
    string,
    { calls: number; inputTokens: number; outputTokens: number; cost: number }
  >;
}

const ENDPOINT_LABELS: Record<string, string> = {
  "passages/generate": "📖 Reading passages",
  "conversation/start": "💬 Conversation setup",
  "conversation/respond": "💬 Conversation replies",
};

export function UsageStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Spinner size="sm" /> Loading usage stats…
      </div>
    );
  }

  if (!stats || stats.totalCalls === 0) {
    return (
      <p className="text-sm text-gray-400">
        No usage yet — start practising to see your stats.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="API Calls" value={stats.totalCalls.toLocaleString()} />
        <StatTile
          label="Input tokens"
          value={stats.totalInput.toLocaleString()}
        />
        <StatTile
          label="Output tokens"
          value={stats.totalOutput.toLocaleString()}
        />
        <StatTile
          label="Est. cost"
          value={`$${stats.totalCost.toFixed(4)}`}
          highlight
        />
      </div>

      {/* Per-endpoint breakdown */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Feature</th>
              <th className="px-4 py-2 font-medium text-right">Calls</th>
              <th className="px-4 py-2 font-medium text-right">Input</th>
              <th className="px-4 py-2 font-medium text-right">Output</th>
              <th className="px-4 py-2 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.byEndpoint).map(([endpoint, data]) => (
              <tr
                key={endpoint}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="px-4 py-2 text-gray-700">
                  {ENDPOINT_LABELS[endpoint] ?? endpoint}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {data.calls}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {data.inputTokens.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {data.outputTokens.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right font-medium text-gray-800">
                  ${data.cost.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Pricing: $1.00 / 1M input tokens · $5.00 / 1M output tokens (claude-haiku-4-5)
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        highlight
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold ${
          highlight ? "text-blue-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
