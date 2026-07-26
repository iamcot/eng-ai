"use client";

import { useEffect, useRef, useState } from "react";

interface TooltipData {
  phonetic: string | null;
  loading: boolean;
}

interface WordTooltipProps {
  word: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

function usePhonetic(word: string) {
  const [data, setData] = useState<TooltipData>({ phonetic: null, loading: true });

  useEffect(() => {
    setData({ phonetic: null, loading: true });
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!clean) { setData({ phonetic: null, loading: false }); return; }

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean}`)
      .then((r) => r.json())
      .then((json) => {
        const phonetic =
          json?.[0]?.phonetic ||
          json?.[0]?.phonetics?.find((p: { text?: string }) => p.text)?.text ||
          null;
        setData({ phonetic, loading: false });
      })
      .catch(() => setData({ phonetic: null, loading: false }));
  }, [word]);

  return data;
}

function speak(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export function WordTooltip({ word, onClose, anchorRef }: WordTooltipProps) {
  const { phonetic, loading } = usePhonetic(word);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 whitespace-nowrap text-sm"
    >
      {/* Pointer */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />

      {loading ? (
        <span className="text-gray-400 text-xs">loading…</span>
      ) : phonetic ? (
        <span className="font-mono text-yellow-300">{phonetic}</span>
      ) : (
        <span className="text-gray-300 italic text-xs">no phonetic</span>
      )}

      <button
        onClick={() => speak(word)}
        className="ml-1 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
        title="Play pronunciation"
      >
        🔊
      </button>
    </div>
  );
}
