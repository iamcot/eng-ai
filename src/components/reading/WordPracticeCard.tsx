"use client";

import { useEffect, useRef, useState } from "react";
import { fetchWordIPA, splitIPA } from "@/lib/ipaLookup";

interface WordPracticeCardProps {
  word: string;
  colorClass: string;           // border + bg color class
  phonemes?: { score: number }[]; // Azure scores — if provided, IPA gets colored
}

const IPA_FONT = { fontFamily: "var(--font-noto-sans), 'Segoe UI', sans-serif" };

function speak(word: string) {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-GB";
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

function phonemeColor(score: number) {
  if (score >= 85) return "text-green-300";
  if (score >= 70) return "text-amber-300";
  return "text-red-400 font-bold";
}

export function WordPracticeCard({ word, colorClass, phonemes }: WordPracticeCardProps) {
  const [open, setOpen] = useState(false);
  const [ipa, setIpa] = useState<string | null | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch IPA lazily when tooltip opens
  useEffect(() => {
    if (!open || ipa !== undefined) return;
    fetchWordIPA(word.toLowerCase().replace(/[^a-z]/g, "")).then(setIpa).catch(() => setIpa(null));
  }, [open, word, ipa]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const ipaPhonemes = ipa ? splitIPA(ipa) : [];

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`text-sm font-medium px-2 py-0.5 rounded border transition-opacity hover:opacity-80 ${colorClass}`}
      >
        {word}
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-1.5 left-0 bg-gray-900 text-white rounded-xl shadow-xl p-3 min-w-[140px]">
          {/* Triangle pointer */}
          <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />

          {/* IPA display */}
          <div className="mb-2">
            {ipa === undefined ? (
              <span className="text-xs text-gray-400">Đang tải…</span>
            ) : ipaPhonemes.length > 0 ? (
              <div className="flex flex-wrap items-center text-sm text-yellow-300" style={IPA_FONT}>
                <span>/</span>
                {ipaPhonemes.map((sym, j) => {
                  const score = phonemes?.[j]?.score;
                  return (
                    <span key={j} className={score !== undefined ? phonemeColor(score) : ""}>
                      {sym}
                    </span>
                  );
                })}
                <span>/</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">không có IPA</span>
            )}
          </div>

          {/* TTS button */}
          <button
            onClick={() => { speak(word); }}
            className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 transition-colors"
          >
            🔊 Nghe phát âm
          </button>
        </div>
      )}
    </div>
  );
}
