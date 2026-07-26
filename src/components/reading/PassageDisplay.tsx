"use client";

import { WordResult } from "@/lib/textComparison";
import { WordToken } from "./WordToken";

interface PassageDisplayProps {
  passage: string;
  wordResults: WordResult[] | null;
  isRecording: boolean;
  hasRecording?: boolean;
  onPlayWordClip?: (wordIndex: number) => void;
}

export function PassageDisplay({ passage, wordResults, isRecording, hasRecording, onPlayWordClip }: PassageDisplayProps) {
  const words = passage.split(/\s+/).filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xl" style={{ lineHeight: "3.2rem" }}>
      {wordResults ? (
        <>
          {wordResults.map((result, i) => (
            <WordToken key={i} result={result} wordIndex={i} onPlayClip={hasRecording ? onPlayWordClip : undefined} />
          ))}
          {isRecording && <span className="ml-1 animate-pulse text-blue-500">●</span>}
        </>
      ) : (
        <>
          {words.map((word, i) => (
            <span key={i} className={isRecording ? "text-gray-700" : "text-gray-800"}>
              {word}{" "}
            </span>
          ))}
          {isRecording && <span className="ml-1 animate-pulse text-blue-500">●</span>}
        </>
      )}
    </div>
  );
}
