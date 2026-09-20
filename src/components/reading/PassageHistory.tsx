"use client";

import { useState } from "react";
import { PassageEntry, AttemptRecord } from "@/hooks/usePassageHistory";
import { WordResult } from "@/lib/textComparison";

interface PassageHistoryProps {
  history: PassageEntry[];
  activeId: string | null;
  onSelect: (entry: PassageEntry, replayWords?: WordResult[] | null, replayScore?: number) => void;
  onDelete: (passageId: string) => void;
}

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

function AttemptItem({ attempt, onReplay }: { attempt: AttemptRecord; onReplay: () => void }) {
  return (
    <button
      onClick={onReplay}
      className="w-full text-left flex items-center justify-between rounded px-2 py-1 hover:bg-gray-100 transition-colors"
    >
      <span className="text-xs text-gray-500">{formatDate(attempt.completedAt)}</span>
      <span className={`text-xs font-semibold ${scoreColor(attempt.score)}`}>{attempt.score}%</span>
    </button>
  );
}

export function PassageHistory({ history, activeId, onSelect, onDelete }: PassageHistoryProps) {
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  if (history.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-4">Chưa có bài đọc nào</div>;
  }

  function toggleAttempts(passageId: string) {
    setExpandedAttempts((prev) => {
      const next = new Set(prev);
      next.has(passageId) ? next.delete(passageId) : next.add(passageId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {history.map((entry) => {
        const isActive = entry.passageId === activeId;
        const hasAttempts = entry.attempts.length > 0;
        const showAttempts = expandedAttempts.has(entry.passageId);

        return (
          <div key={entry.passageId} className="flex flex-col">
            <div
              className={`group relative rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                isActive ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => onSelect(entry)}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 rounded px-1">{entry.level}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[80px]">{entry.topic}</span>
                </div>
                <div className="flex items-center gap-1">
                  {entry.bestScore !== null && (
                    <span className={`text-xs font-bold ${scoreColor(entry.bestScore)}`}>{entry.bestScore}%</span>
                  )}
                  <button
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-opacity ml-1"
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.passageId); }}
                    title="Xóa"
                  >✕</button>
                </div>
              </div>

              {/* Preview */}
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {entry.passage.slice(0, 80)}…
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{formatDate(entry.completedAt)}</span>
                {hasAttempts && (
                  <button
                    className="text-xs text-blue-500 hover:text-blue-700"
                    onClick={(e) => { e.stopPropagation(); toggleAttempts(entry.passageId); }}
                  >
                    {entry.attempts.length} lần thử {showAttempts ? "▲" : "▼"}
                  </button>
                )}
              </div>
            </div>

            {/* Previous attempts section */}
            {showAttempts && hasAttempts && (
              <div className="ml-2 border-l-2 border-blue-100 pl-2 flex flex-col mt-0.5">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Lần trước</p>
                {entry.attempts.map((attempt) => (
                  <AttemptItem
                    key={attempt.id}
                    attempt={attempt}
                    onReplay={() => onSelect(entry, attempt.wordResults, attempt.score)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
