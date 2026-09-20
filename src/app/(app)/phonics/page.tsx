"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserSupportCheck } from "@/components/shared/BrowserSupport";
import { SoundCard } from "@/components/phonics/SoundCard";
import { Button } from "@/components/ui/Button";
import { SOUNDS, CATEGORIES, CATEGORY_LABELS } from "@/lib/ipa";

type Mode = "word" | "sound";

export default function PhonicsPage() {
  const [mode, setMode] = useState<Mode>("word");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [resetKey, setResetKey] = useState(0);

  // Request mic permission once on mount so SDK never creates conflicting streams
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => stream.getTracks().forEach(t => t.stop()))
      .catch(() => {});
  }, []);

  const handleRecordStart = useCallback((id: string) => setActiveCardId(id), []);
  const handleRecordStop = useCallback(() => setActiveCardId(null), []);
  const handleResult = useCallback((id: string, correct: boolean) => {
    if (correct) setCorrectIds((prev) => new Set(prev).add(id));
    else setCorrectIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  function handleReset() {
    setCorrectIds(new Set());
    setResetKey((k) => k + 1);
    setActiveCardId(null);
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    setResetKey((k) => k + 1); // remount cards to clear scores
    setActiveCardId(null);
  }

  const correctCount = correctIds.size;
  const total = SOUNDS.length;
  const pct = Math.round((correctCount / total) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔤 Phonics</h1>
          <p className="mt-1 text-gray-600">
            Luyện 44 âm tiếng Anh. Nhấn 🔊 để nghe, 🎤 để luyện đọc.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Progress + mode toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tiến độ</span>
            <span className="text-sm font-semibold text-gray-900">{correctCount} / {total}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shrink-0">
          <button
            onClick={() => handleModeChange("word")}
            className={`px-3 py-1.5 transition-colors ${mode === "word" ? "bg-blue-500 text-white font-medium" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            Từ mẫu
          </button>
          <button
            onClick={() => handleModeChange("sound")}
            className={`px-3 py-1.5 transition-colors ${mode === "sound" ? "bg-blue-500 text-white font-medium" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            Âm đơn
          </button>
        </div>
      </div>

      <BrowserSupportCheck>
        <div className="flex flex-col gap-8" key={resetKey}>
          {CATEGORIES.map((category) => (
            <section key={category}>
              <h2 className="text-base font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-1">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {SOUNDS.filter((s) => s.category === category).map((sound) => (
                  <SoundCard
                    key={sound.id}
                    sound={sound}
                    mode={mode}
                    isActiveRecording={activeCardId !== null && activeCardId !== sound.id}
                    onRecordStart={handleRecordStart}
                    onRecordStop={handleRecordStop}
                    onResult={handleResult}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </BrowserSupportCheck>
    </div>
  );
}
