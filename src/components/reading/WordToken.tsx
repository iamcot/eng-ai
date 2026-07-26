"use client";

import { useRef, useState } from "react";
import { WordResult } from "@/lib/textComparison";
import { WordTooltip } from "./WordTooltip";

interface WordTokenProps {
  result: WordResult;
  wordIndex?: number;
  onPlayClip?: (wordIndex: number) => void;
}

export function WordToken({ result, wordIndex, onPlayClip }: WordTokenProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  if (result.status === "correct") {
    return <span className="text-green-600">{result.word}{" "}</span>;
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
              onPlayMyVoice={onPlayClip && wordIndex !== undefined ? () => { console.log("[WordToken] play clip at index", wordIndex, "onPlayClip=", !!onPlayClip); onPlayClip(wordIndex); } : undefined}
            />
          )}
        </span>
        {" "}
      </>
    );
  }

  return <span className="text-gray-700">{result.word}{" "}</span>;
}
