"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MouthDiagram } from "@/components/phonics/MouthDiagram";
import { useAzurePronunciation } from "@/hooks/useAzurePronunciation";
import { speakIpa } from "@/lib/azureTts";
import type { IpaSound } from "@/lib/ipa";

type Mode = "word" | "sound";

interface SoundCardProps {
  sound: IpaSound;
  mode: Mode;
  isActiveRecording: boolean;
  onRecordStart: (id: string) => void;
  onRecordStop: () => void;
  onResult: (id: string, correct: boolean) => void;
}

function speak(text: string) {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.7;
  window.speechSynthesis.speak(u);
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700 border-green-300"
      : score >= 60
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-red-100 text-red-700 border-red-300";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

function GuideModal({ sound, mode, onClose }: { sound: IpaSound; mode: Mode; onClose: () => void }) {
  const activeText = mode === "word" ? sound.word : sound.soundPhrase;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-noto-sans), 'Segoe UI', sans-serif" }}>{sound.symbol}</span>
            <span className="text-sm text-gray-500">— <em>{activeText}</em></span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
            ✕
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <MouthDiagram shape={sound.mouthShape} size={160}/>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{sound.hint}</p>

        <button
          onClick={() => mode === "sound" ? speakIpa(sound.symbol) : speak(activeText)}
          className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
        >
          🔊 Nghe mẫu — <em>{activeText}</em>
        </button>
      </div>
    </div>
  );
}

export function SoundCard({
  sound,
  mode,
  isActiveRecording,
  onRecordStart,
  onRecordStop,
  onResult,
}: SoundCardProps) {
  const [currentWord, setCurrentWord] = useState(sound.word);
  const activeText = mode === "word" ? currentWord : sound.soundPhrase;
  const { status, score, start, stop, reset } = useAzurePronunciation(activeText);
  const [showGuide, setShowGuide] = useState(false);
  const notifiedRef = useRef(false);

  const isRecording = status === "listening";
  const isProcessing = status === "processing";
  const isInitializing = status === "initializing";
  const isDone = status === "done";
  const isUnconfigured = status === "unconfigured";
  const isBusy = isInitializing || isRecording || isProcessing;

  // Reset when mode changes from parent
  useEffect(() => {
    if (mode === "word") setCurrentWord(sound.word);
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleReload() {
    const others = sound.examples.filter(w => w !== currentWord);
    const pool = others.length > 0 ? others : sound.examples;
    setCurrentWord(pool[Math.floor(Math.random() * pool.length)]);
    reset();
  }

  useEffect(() => {
    if ((status === "done" || status === "error") && !notifiedRef.current) {
      notifiedRef.current = true;
      onRecordStop();
      if (status === "done" && score !== null) {
        onResult(sound.id, score >= 70);
      }
    }
  }, [status, score, sound.id, onRecordStop, onResult]);

  const handleStart = useCallback(async () => {
    notifiedRef.current = false;
    reset();
    onRecordStart(sound.id);
    await start();
  }, [reset, start, onRecordStart, sound.id]);

  const handleStop = useCallback(() => {
    stop();
    onRecordStop();
  }, [stop, onRecordStop]);

  const borderColor =
    isDone && score !== null
      ? score >= 80 ? "border-green-300 bg-green-50"
        : score >= 60 ? "border-yellow-300 bg-yellow-50"
        : "border-red-300 bg-red-50"
      : isRecording ? "border-blue-400 bg-blue-50/30"
      : isInitializing || isProcessing ? "border-gray-300"
      : "border-gray-200";

  return (
    <>
      <div className={`rounded-xl border-2 bg-white shadow-sm p-2.5 flex flex-col gap-2 transition-colors ${borderColor}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-noto-sans), 'Segoe UI', sans-serif" }}>{sound.symbol}</span>
          <div className="flex items-center gap-1">
            {isDone && score !== null ? <ScoreBadge score={score}/> : <span className="text-gray-300 text-sm">—</span>}
            <button
              onClick={() => setShowGuide(true)}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 text-xs flex items-center justify-center transition-colors"
              title="Xem cách phát âm"
            >
              ?
            </button>
          </div>
        </div>

        {/* Active text label */}
        <div className="flex items-center gap-0.5">
          <p className="text-sm font-semibold text-gray-800 truncate">{activeText}</p>
          {mode === "word" && (
            <button
              onClick={handleReload}
              disabled={isBusy}
              className="text-gray hover:text-blue-500 disabled:opacity-30 transition-colors text-sm leading-none shrink-0"
              title="Từ khác"
            >
              ↻
            </button>
          )}
        </div>

        {isUnconfigured && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            No Azure key
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-600">Lỗi mic</p>
        )}

        {/* Controls */}
        <div className="flex gap-1 mt-auto items-center">
          <Button variant="secondary" size="sm"
            onClick={() => mode === "sound" ? speakIpa(sound.symbol) : speak(activeText)}
            disabled={isBusy}
            className="px-2 text-xs"
          >
            🔊
          </Button>

          {isInitializing && (
            <div className="flex items-center gap-1 flex-1 text-xs text-gray-500">
              <Spinner size="sm"/>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-1 flex-1">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/>
              </span>
              <button onClick={handleStop} className="text-xs text-gray-400 hover:text-red-600 underline">
                Hủy
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-1 flex-1 text-xs text-gray-500">
              <Spinner size="sm"/>
            </div>
          )}

          {!isBusy && (
            <Button variant="primary" size="sm" onClick={handleStart} disabled={isActiveRecording} className="flex-1 text-xs px-1">
              {isDone ? "↺" : "🎤"}
            </Button>
          )}
        </div>
      </div>

      {showGuide && <GuideModal sound={sound} mode={mode} onClose={() => setShowGuide(false)}/>}
    </>
  );
}
