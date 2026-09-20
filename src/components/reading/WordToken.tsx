"use client";

import { useRef, useState } from "react";
import { WordResult } from "@/lib/textComparison";
import { WordTooltip } from "./WordTooltip";

interface WordTokenProps {
  result: WordResult;
  wordIndex?: number;
  onPlayClip?: (wordIndex: number) => void;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-lime-600";
  if (score >= 55) return "text-amber-500";
  return "text-red-600";
}

export function WordToken({ result, wordIndex, onPlayClip }: WordTokenProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  // Azure scored result — color only, score in tooltip
  if (result.accuracyScore !== undefined) {
    const score = result.accuracyScore;
    if (result.status === "missed") {
      return <span className="text-gray-400 line-through">{result.word}{" "}</span>;
    }
    return (
      <>
        <span
          className={`relative inline-block cursor-pointer ${scoreColor(score)} select-none`}
          ref={anchorRef}
          onClick={() => setShowTooltip(v => !v)}
          title={`${score}/100 — nhấn để xem`}
        >
          {result.word}
          {showTooltip && (
            <WordTooltip
              word={result.word}
              transcribedWord={result.transcribedWord}
              anchorRef={anchorRef}
              onClose={() => setShowTooltip(false)}
              onPlayMyVoice={onPlayClip && wordIndex !== undefined ? () => onPlayClip(wordIndex) : undefined}
            />
          )}
        </span>
        {" "}
      </>
    );
  }

  // Standard text-comparison result (no Azure scores)
  if (result.status === "correct") {
    return (
      <>
        <span className="relative inline-block cursor-pointer text-green-600" ref={anchorRef} onClick={() => setShowTooltip(v => !v)}>
          {result.word}
          {showTooltip && (
            <WordTooltip word={result.word} anchorRef={anchorRef} onClose={() => setShowTooltip(false)}
              onPlayMyVoice={onPlayClip && wordIndex !== undefined ? () => onPlayClip(wordIndex) : undefined}
            />
          )}
        </span>
        {" "}
      </>
    );
  }

  if (result.status === "missed") {
    return <span className="text-gray-400 line-through">{result.word}{" "}</span>;
  }

  if (result.status === "wrong") {
    return (
      <>
        <span className="relative inline-block cursor-pointer" ref={anchorRef} onClick={() => setShowTooltip((v) => !v)}>
          <span className="text-red-600 underline decoration-wavy decoration-red-400 select-none">
            {result.word}
          </span>
          {result.transcribedWord && (
            <span
              className="absolute left-0 text-[0.8rem] text-red-400 italic whitespace-nowrap"
              style={{ top: "1.5em" }}
            >
              &ldquo;{result.transcribedWord}&rdquo;
            </span>
          )}
          {showTooltip && (
            <WordTooltip
              word={result.word}
              transcribedWord={result.transcribedWord}
              anchorRef={anchorRef}
              onClose={() => setShowTooltip(false)}
              onPlayMyVoice={onPlayClip && wordIndex !== undefined ? () => onPlayClip(wordIndex) : undefined}
            />
          )}
        </span>
        {" "}
      </>
    );
  }

  return <span className="text-gray-700">{result.word}{" "}</span>;
}
