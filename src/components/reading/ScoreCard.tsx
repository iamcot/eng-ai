"use client";

import { ComparisonResult } from "@/lib/textComparison";
import { WordPracticeCard } from "@/components/reading/WordPracticeCard";

interface ScoreCardProps {
  result: ComparisonResult;
}

export function ScoreCard({ result }: ScoreCardProps) {
  const { score, correctCount, totalCount, words } = result;
  const wrongWords = words.filter(w => w.status === "wrong" || w.status === "missed");

  const scorePill =
    score >= 90 ? "bg-green-50 border-green-200 text-green-700"
    : score >= 70 ? "bg-yellow-50 border-yellow-200 text-yellow-700"
    : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex gap-3 flex-wrap text-sm">
        <span className={`px-3 py-1 rounded-full border font-medium ${scorePill}`}>
          Điểm: <strong>{score}%</strong>
        </span>
        <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
          Đúng: <strong>{correctCount}/{totalCount}</strong>
        </span>
      </div>

      {wrongWords.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Từ cần luyện thêm — nhấn để xem IPA:</p>
          <div className="flex flex-wrap gap-2">
            {wrongWords.map((w, i) => (
              <WordPracticeCard
                key={i}
                word={w.word}
                colorClass="border-red-200 bg-white text-red-700"
              />
            ))}
          </div>
        </div>
      )}

      {score === 100 && <p className="text-sm font-medium text-green-700">🎉 Hoàn hảo!</p>}
    </div>
  );
}
