"use client";

import { WordResult } from "@/lib/textComparison";
import { WordToken } from "./WordToken";

interface PassageDisplayProps {
  passage: string;
  wordResults: WordResult[] | null;
  isRecording: boolean;
}

export function PassageDisplay({
  passage,
  wordResults,
  isRecording,
}: PassageDisplayProps) {
  const words = passage.split(/\s+/).filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xl" style={{ lineHeight: "3.2rem" }}>
      {wordResults ? (
        // Show comparison results
        <>
          {wordResults.map((result, i) => (
            <WordToken key={i} result={result} />
          ))}
          {isRecording && (
            <span className="ml-1 animate-pulse text-blue-500">●</span>
          )}
        </>
      ) : (
        // Show plain passage (before recording)
        <>
          {words.map((word, i) => (
            <span
              key={i}
              className={isRecording ? "text-gray-700" : "text-gray-800"}
            >
              {word}{" "}
            </span>
          ))}
          {isRecording && (
            <span className="ml-1 animate-pulse text-blue-500">●</span>
          )}
        </>
      )}
    </div>
  );
}
