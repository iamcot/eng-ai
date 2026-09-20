"use client";

import { useRef, useState } from "react";
import { WordResult } from "@/lib/textComparison";
import { WordToken } from "./WordToken";
import { WordTooltip } from "./WordTooltip";

interface PassageDisplayProps {
  passage: string;
  wordResults: WordResult[] | null;
  isRecording: boolean;
  hasRecording?: boolean;
  onPlayWordClip?: (wordIndex: number) => void;
}

function WordPreview({ word }: { word: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <>
      <span ref={ref} className="relative inline-block cursor-pointer text-gray-800 hover:text-blue-600 transition-colors select-none"
        onClick={() => setOpen(v => !v)}>
        {word}
        {open && <WordTooltip word={word} anchorRef={ref} onClose={() => setOpen(false)} />}
      </span>
      {" "}
    </>
  );
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
            isRecording
              ? <span key={i} className="text-gray-700">{word}{" "}</span>
              : <WordPreview key={i} word={word} />
          ))}
          {isRecording && <span className="ml-1 animate-pulse text-blue-500">●</span>}
        </>
      )}
    </div>
  );
}
