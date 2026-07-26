"use client";

import { useEffect, useRef, useState } from "react";

interface PhoneticData {
  passage: string | null;
  transcribed: string | null;
  loading: boolean;
}

interface WordTooltipProps {
  word: string;
  transcribedWord?: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onPlayMyVoice?: () => void;
}

interface DiffChar {
  ch: string;
  match: boolean;
}

// Fetch and extract IPA for a single word
async function fetchIPA(word: string): Promise<string | null> {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return null;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (
      json?.[0]?.phonetic ||
      json?.[0]?.phonetics?.find((p: { text?: string }) => p.text)?.text ||
      null
    );
  } catch {
    return null;
  }
}

function usePhonetics(word: string, transcribedWord?: string): PhoneticData {
  const [data, setData] = useState<PhoneticData>({ passage: null, transcribed: null, loading: true });

  useEffect(() => {
    setData({ passage: null, transcribed: null, loading: true });

    const fetches: Promise<string | null>[] = [fetchIPA(word)];
    if (transcribedWord) fetches.push(fetchIPA(transcribedWord));

    Promise.all(fetches).then(([passage, transcribed = null]) => {
      console.log("[Tooltip] IPA result:", { word, transcribedWord, passage, transcribed });
      setData({ passage, transcribed, loading: false });
    });
  }, [word, transcribedWord]);

  return data;
}

// LCS-based character diff — returns two aligned arrays
function diffIPA(a: string, b: string): [DiffChar[], DiffChar[]] {
  // Strip slashes
  const sa = a.replace(/^\/|\/$/g, "");
  const sb = b.replace(/^\/|\/$/g, "");

  const m = sa.length, n = sb.length;
  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = sa[i - 1] === sb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const aChars: DiffChar[] = [];
  const bChars: DiffChar[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && sa[i - 1] === sb[j - 1]) {
      aChars.unshift({ ch: sa[i - 1], match: true });
      bChars.unshift({ ch: sb[j - 1], match: true });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      aChars.unshift({ ch: "·", match: false }); // gap in passage side
      bChars.unshift({ ch: sb[j - 1], match: false });
      j--;
    } else {
      aChars.unshift({ ch: sa[i - 1], match: false });
      bChars.unshift({ ch: "·", match: false }); // gap in transcribed side
      i--;
    }
  }

  return [aChars, bChars];
}

function DiffedIPA({ chars, side }: { chars: DiffChar[]; side: "passage" | "transcribed" }) {
  return (
    <span className="font-mono tracking-wide">
      /
      {chars.map((c, i) => {
        if (c.match) return <span key={i} className="text-yellow-300">{c.ch}</span>;
        if (c.ch === "·") return <span key={i} className="text-gray-500 opacity-40">·</span>;
        return (
          <span key={i} className={side === "passage" ? "text-green-300 font-bold" : "text-red-400 font-bold"}>
            {c.ch}
          </span>
        );
      })}
      /
    </span>
  );
}

function speak(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export function WordTooltip({ word, transcribedWord, onClose, anchorRef, onPlayMyVoice }: WordTooltipProps) {
  const { passage, transcribed, loading } = usePhonetics(word, transcribedWord);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isWrong = transcribedWord !== undefined;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  // Compute diff if both IPA available
  const [passageDiff, transcribedDiff] =
    isWrong && passage && transcribed ? diffIPA(passage, transcribed) : [null, null];

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-xl text-sm"
      style={{ minWidth: isWrong ? "220px" : "140px" }}
    >
      {/* Pointer */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />

      {loading ? (
        <div className="px-4 py-3 text-gray-400 text-xs">Loading phonetics…</div>
      ) : isWrong ? (
        /* Two-column diff layout */
        <div className="flex divide-x divide-gray-700">
          {/* Passage word */}
          <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 flex-1">
            <span className="text-[0.65rem] text-gray-400 uppercase tracking-wider">Should say</span>
            <span className="text-white font-medium">{word}</span>
            {passageDiff ? (
              <DiffedIPA chars={passageDiff} side="passage" />
            ) : (
              <span className="text-gray-500 italic text-xs">{passage ?? "no phonetic"}</span>
            )}
            <button
              onClick={() => speak(word)}
              className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-sm"
              title="Play"
            >🔊</button>
          </div>

          {/* Transcribed word */}
          <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 flex-1">
            <span className="text-[0.65rem] text-gray-400 uppercase tracking-wider">You said</span>
            <span className="text-red-300 font-medium">{transcribedWord}</span>
            {transcribedDiff ? (
              <DiffedIPA chars={transcribedDiff} side="transcribed" />
            ) : (
              <span className="text-gray-500 italic text-xs">{transcribed ?? "no phonetic"}</span>
            )}
            <button
              onClick={() => speak(transcribedWord!)}
              className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-sm"
              title="Play TTS"
            >🔊</button>
          </div>
        </div>
      ) : (
        /* Single-column fallback (correct words or no transcribedWord) */
        <div className="flex items-center gap-2 px-3 py-2.5">
          {passage ? (
            <span className="font-mono text-yellow-300">{passage}</span>
          ) : (
            <span className="text-gray-400 italic text-xs">no phonetic</span>
          )}
          <button
            onClick={() => speak(word)}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
            title="Play"
          >🔊</button>
        </div>
      )}
    </div>
  );
}
