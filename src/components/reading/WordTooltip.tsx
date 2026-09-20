"use client";

import { useEffect, useRef, useState } from "react";
import { fetchWordIPA } from "@/lib/ipaLookup";

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

function usePhonetics(word: string, transcribedWord?: string): PhoneticData {
  const [data, setData] = useState<PhoneticData>({ passage: null, transcribed: null, loading: true });

  useEffect(() => {
    setData({ passage: null, transcribed: null, loading: true });

    // Never hang more than 5 seconds
    const bail = setTimeout(() => {
      setData(prev => ({ ...prev, loading: false }));
    }, 5000);

    const fetches: Promise<string | null>[] = [fetchWordIPA(word)];
    if (transcribedWord) fetches.push(fetchWordIPA(transcribedWord));

    Promise.all(fetches)
      .then(([passage, transcribed = null]) => {
        clearTimeout(bail);
        setData({ passage, transcribed, loading: false });
      })
      .catch(() => {
        clearTimeout(bail);
        setData({ passage: null, transcribed: null, loading: false });
      });

    return () => clearTimeout(bail);
  }, [word, transcribedWord]);

  return data;
}

// LCS-based character diff — returns two aligned arrays
function diffIPA(a: string, b: string): [DiffChar[], DiffChar[]] {
  const sa = a.replace(/^\/|\/$/g, "").replace(/[\s.]/g, "");
  const sb = b.replace(/^\/|\/$/g, "").replace(/[\s.]/g, "");

  const m = sa.length, n = sb.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = sa[i - 1] === sb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const aChars: DiffChar[] = [];
  const bChars: DiffChar[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && sa[i - 1] === sb[j - 1]) {
      aChars.unshift({ ch: sa[i - 1], match: true });
      bChars.unshift({ ch: sb[j - 1], match: true });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      aChars.unshift({ ch: "·", match: false });
      bChars.unshift({ ch: sb[j - 1], match: false });
      j--;
    } else {
      aChars.unshift({ ch: sa[i - 1], match: false });
      bChars.unshift({ ch: "·", match: false });
      i--;
    }
  }

  return [aChars, bChars];
}

const IPA_FONT = { fontFamily: "var(--font-noto-sans), 'Segoe UI', sans-serif" };

function DiffedIPA({ chars, side }: { chars: DiffChar[]; side: "passage" | "transcribed" }) {
  return (
    <span className="whitespace-nowrap text-sm" style={IPA_FONT}>
      /
      {chars.map((c, i) => {
        if (c.match) return <span key={i} className="text-yellow-300">{c.ch}</span>;
        if (c.ch === "·") return null;
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

  const [passageDiff, transcribedDiff] =
    isWrong && passage && transcribed ? diffIPA(passage, transcribed) : [null, null];

  return (
    <div
      ref={tooltipRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-xl text-sm w-max"
    >
      {/* Pointer */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />

      {loading ? (
        <div className="px-4 py-3 text-gray-400 text-xs">Đang tải…</div>
      ) : isWrong ? (
        <div className="flex divide-x divide-gray-700">
          <div className="flex flex-col items-center gap-1.5 px-3 py-2.5">
            <span className="text-[0.65rem] text-gray-400 uppercase tracking-wider whitespace-nowrap">Chuẩn</span>
            <span className="text-white font-medium whitespace-nowrap">{word}</span>
            {passageDiff ? (
              <DiffedIPA chars={passageDiff} side="passage" />
            ) : (
              <span className="text-gray-500 italic text-xs whitespace-nowrap">{passage ?? "không có IPA"}</span>
            )}
            <button
              onClick={() => speak(word)}
              className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-sm"
              title="Play"
            >🔊</button>
          </div>

          <div className="flex flex-col items-center gap-1.5 px-3 py-2.5">
            <span className="text-[0.65rem] text-gray-400 uppercase tracking-wider whitespace-nowrap">Bạn nói</span>
            <span className="text-red-300 font-medium whitespace-nowrap">{transcribedWord}</span>
            {transcribedDiff ? (
              <DiffedIPA chars={transcribedDiff} side="transcribed" />
            ) : (
              <span className="text-gray-500 italic text-xs whitespace-nowrap">{transcribed ?? "không có IPA"}</span>
            )}
            <button
              onClick={() => speak(transcribedWord!)}
              className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-sm"
              title="Play TTS"
            >🔊</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5">
          {passage ? (
            <span className="text-yellow-300 whitespace-nowrap" style={IPA_FONT}>{passage}</span>
          ) : (
            <span className="text-gray-400 italic text-xs">không có IPA</span>
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
