"use client";

import { useEffect, useRef, useState } from "react";
import { WordResult } from "@/lib/textComparison";
import { WordToken } from "./WordToken";
import { WordTooltip } from "./WordTooltip";
import { speakText } from "@/lib/azureTts";

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
      <span
        ref={ref}
        className="relative inline-block cursor-pointer text-gray-800 hover:text-blue-600 transition-colors"
        onClick={() => {
          if (window.getSelection()?.toString().trim()) return;
          setOpen(v => !v);
        }}
      >
        {word}
        {open && <WordTooltip word={word} anchorRef={ref} onClose={() => setOpen(false)} />}
      </span>
      {" "}
    </>
  );
}

interface CtxMenu { x: number; y: number; text: string }

function SelectionMenu({ menu, onClose }: { menu: CtxMenu; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  async function handleSpeak() {
    setLoading(true);
    onClose();
    await speakText(menu.text);
    setLoading(false);
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl py-1 text-sm"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        onClick={handleSpeak}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 w-full hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        🔊 <span>Đọc đoạn được chọn</span>
      </button>
    </div>
  );
}

export function PassageDisplay({ passage, wordResults, isRecording, hasRecording, onPlayWordClip }: PassageDisplayProps) {
  const words = passage.split(/\s+/).filter(Boolean);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleContextMenu(e: React.MouseEvent) {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, text: selected });
  }

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="rounded-lg border border-gray-200 bg-white p-6 text-xl"
        style={{ lineHeight: "3.2rem" }}
      >
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

      {ctxMenu && (
        <SelectionMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}
