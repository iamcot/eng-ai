"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAzurePronunciation } from "@/hooks/useAzurePronunciation";
import { speakText } from "@/lib/azureTts";

interface VocabWord {
  id: string;
  word: string;
  exampleSentence: string | null;
  interval: number;
  nextReviewAt: string;
}

interface WordDetailSheetProps {
  word: VocabWord;
  userLevel: string;
  onClose: () => void;
  onAttempt: (wordId: string, correct: boolean) => void;
}

function useIPA(word: string) {
  const [ipa, setIpa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setIpa(null);
    setLoading(true);
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    fetch(`https://en.wiktionary.org/w/api.php?action=query&titles=${clean}&prop=revisions&rvprop=content&rvslots=main&format=json&origin=*`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => {
        clearTimeout(t);
        const pages = (json as { query?: { pages?: Record<string, { revisions?: { slots?: { main?: { "*"?: string } } }[] }> } })?.query?.pages ?? {};
        const pageId = Object.keys(pages)[0];
        if (!pageId || pageId === "-1") { setIpa(null); return; }
        const rev = pages[pageId]?.revisions?.[0];
        const wikitext = rev?.slots?.main?.["*"] ?? "";
        const enSection = wikitext.match(/==English==([\s\S]*?)(?:\n==[^=]|$)/)?.[1] ?? wikitext;
        const m = enSection.match(/\{\{IPA\|en\|\/([^/|{}\n]{1,50})\//);
        setIpa(m?.[1] ? `/${m[1].replace(/ɹ/g, "r")}/` : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [word]);
  return { ipa, loading };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-green-100 text-green-700 border-green-200"
    : score >= 70 ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-red-100 text-red-700 border-red-200";
  const label = score >= 85 ? "Tốt lắm! 🎉" : score >= 70 ? "Khá ổn" : "Cần luyện thêm";
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${color}`}>
      <span className="text-lg font-bold">{score}</span>
      <span>/100 — {label}</span>
    </div>
  );
}

const IPA_FONT = { fontFamily: "var(--font-noto-sans), 'Segoe UI', sans-serif" };

export function WordDetailSheet({ word, userLevel, onClose, onAttempt }: WordDetailSheetProps) {
  const [sentence, setSentence] = useState<string | null>(word.exampleSentence);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { ipa, loading: ipaLoading } = useIPA(word.word);
  const az = useAzurePronunciation(word.word);

  useEffect(() => {
    if (word.exampleSentence || sentence) return;
    setLoadingSentence(true);
    fetch(`/api/vocab/example?word=${encodeURIComponent(word.word)}&level=${userLevel}`)
      .then(r => r.json())
      .then(d => setSentence(d.sentence ?? null))
      .catch(() => {})
      .finally(() => setLoadingSentence(false));
  }, [word, userLevel, sentence]);

  async function submitAttempt(correct: boolean) {
    setSubmitting(true);
    await fetch("/api/vocab/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, correct }),
    }).catch(() => {});
    onAttempt(word.id, correct);
    setSubmitting(false);
    az.reset();
  }

  const isListening = az.status === "listening" || az.status === "initializing";
  const isDone = az.status === "done";
  const score = az.score ?? 0;
  const isGood = isDone && score >= 70;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">{word.word}</h2>
              <button onClick={() => speakText(word.word)} className="text-gray-400 hover:text-blue-600 text-xl" title="Nghe">🔊</button>
              <button onClick={() => speakText(word.word, "en-US-JennyNeural", "0.6")} className="text-gray-400 hover:text-blue-600 text-lg" title="Chậm">🐢</button>
            </div>
            <div className="h-5 flex items-center">
              {ipaLoading ? (
                <Spinner size="sm" />
              ) : ipa ? (
                <span className="text-gray-500 text-sm" style={IPA_FONT}>{ipa}</span>
              ) : (
                <span className="text-gray-300 text-xs italic">no phonetic</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-1">✕</button>
        </div>

        {/* Example sentence */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 min-h-[3rem] flex items-center">
          {loadingSentence ? (
            <Spinner size="sm" />
          ) : sentence ? (
            <p className="text-gray-700 italic">
              {sentence.split(new RegExp(`(${word.word})`, "gi")).map((part, i) =>
                part.toLowerCase() === word.word.toLowerCase()
                  ? <strong key={i} className="text-blue-700 not-italic">{part}</strong>
                  : <span key={i}>{part}</span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">No example available</p>
          )}
        </div>

        {/* Practice section */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Luyện phát âm:</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isListening) { az.stop(); return; }
                az.reset();
                az.start();
              }}
              disabled={isDone}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-xl shadow transition-colors ${
                isListening ? "bg-red-600 animate-pulse" : isDone ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"
              }`}
              title={isListening ? "Dừng" : "Nói"}
            >
              {isListening ? "⏹" : "🎤"}
            </button>

            <div className="flex-1 text-sm">
              {az.status === "initializing" && <span className="text-blue-500 italic">Đang khởi động…</span>}
              {az.status === "listening" && <span className="text-blue-600 animate-pulse">Đang nghe…</span>}
              {az.status === "processing" && <span className="text-blue-500 italic">Đang phân tích…</span>}
              {az.status === "idle" && <span className="text-gray-400">Nhấn mic và đọc từ</span>}
              {az.status === "error" && <span className="text-red-500 text-xs">Lỗi — thử lại</span>}
              {isDone && az.score !== null && <ScoreBadge score={az.score} />}
            </div>
          </div>

          {isDone && (
            <div className="flex gap-2 flex-wrap">
              {!isGood && (
                <Button variant="secondary" size="sm" onClick={() => az.reset()} disabled={submitting}>
                  🔄 Đọc lại
                </Button>
              )}
              <Button variant="danger" size="sm" className="flex-1" onClick={() => submitAttempt(false)} disabled={submitting}>
                😓 Khó — ôn sớm
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => submitAttempt(true)} disabled={submitting} isLoading={submitting}>
                😊 Dễ — nhớ rồi!
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Ôn tập sau: {word.interval} ngày
        </p>
      </div>
    </div>
  );
}
