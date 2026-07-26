"use client";

import { ComparisonResult } from "@/lib/textComparison";

interface ScoreCardProps {
  result: ComparisonResult;
}

export function ScoreCard({ result }: ScoreCardProps) {
  const { score, correctCount, totalCount, words } = result;

  const wrongWords = words.filter(
    (w) => w.status === "wrong" || w.status === "missed"
  );

  const scoreColor =
    score >= 90
      ? "text-green-600"
      : score >= 70
      ? "text-yellow-600"
      : "text-red-600";

  const scoreBg =
    score >= 90
      ? "bg-green-50 border-green-200"
      : score >= 70
      ? "bg-yellow-50 border-yellow-200"
      : "bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-4 ${scoreBg}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Your Score</h3>
        <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
      </div>

      <div className="flex gap-4 text-sm text-gray-600 mb-4">
        <span>✅ {correctCount} correct</span>
        <span>
          ❌ {totalCount - correctCount} missed/wrong
        </span>
        <span>📝 {totalCount} total words</span>
      </div>

      {wrongWords.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Words to practice:
          </p>
          <div className="flex flex-wrap gap-2">
            {wrongWords.map((w, i) => (
              <span
                key={i}
                className="rounded-full bg-white border border-red-200 px-3 py-1 text-sm text-red-700"
                title={w.transcribedWord ? `You said: "${w.transcribedWord}"` : "Missed"}
              >
                {w.word}
                {w.status === "missed" && (
                  <span className="ml-1 text-xs text-gray-400">(missed)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {score === 100 && (
        <p className="mt-2 text-sm font-medium text-green-700">
          🎉 Perfect! Excellent pronunciation!
        </p>
      )}
    </div>
  );
}
