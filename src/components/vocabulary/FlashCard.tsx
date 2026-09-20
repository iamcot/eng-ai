"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAzurePronunciation } from "@/hooks/useAzurePronunciation";
import { speakText } from "@/lib/azureTts";

interface VocabWordData {
  id: string;
  word: string;
  exampleSentence: string | null;
  interval: number;
  nextReviewAt: string;
}

interface FlashCardProps {
  words: VocabWordData[];
  userLevel: string;
  onComplete: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-green-50 border-green-200 text-green-700"
    : score >= 70 ? "bg-yellow-50 border-yellow-200 text-yellow-700"
    : "bg-red-50 border-red-200 text-red-700";
  const label = score >= 85 ? "Tốt lắm! 🎉" : score >= 70 ? "Khá ổn 👍" : "Cần luyện thêm 💪";
  return (
    <div className={`rounded-xl border px-6 py-4 text-center ${color}`}>
      <p className="text-3xl font-bold mb-1">{score}<span className="text-lg font-normal">/100</span></p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function WordCard({ word, sentence, loadingSentence }: { word: string; sentence: string | null; loadingSentence: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h2 className="text-4xl font-bold text-gray-900">{word}</h2>
        <button onClick={() => speakText(word)} className="text-gray-400 hover:text-blue-600 text-xl" title="Nghe">🔊</button>
        <button onClick={() => speakText(word, "en-US-JennyNeural", "0.6")} className="text-gray-400 hover:text-blue-600 text-lg" title="Chậm">🐢</button>
      </div>
      <div className="min-h-[3rem] flex items-center justify-center">
        {loadingSentence ? (
          <Spinner size="sm" />
        ) : sentence ? (
          <p className="text-gray-600 italic text-lg">
            {sentence.split(new RegExp(`(${word})`, "gi")).map((part, i) =>
              part.toLowerCase() === word.toLowerCase()
                ? <strong key={i} className="text-blue-700 not-italic">{part}</strong>
                : <span key={i}>{part}</span>
            )}
          </p>
        ) : (
          <p className="text-gray-400 text-sm">No example available</p>
        )}
      </div>
    </div>
  );
}

function PronunciationSection({ word, onSubmit }: { word: VocabWordData; onSubmit: (correct: boolean) => void }) {
  const az = useAzurePronunciation(word.word);
  const isDone = az.status === "done";
  const isActive = az.status === "listening" || az.status === "initializing" || az.status === "processing";
  const isListening = az.status === "listening" || az.status === "initializing";
  const score = az.score ?? 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {!isDone && (
        <>
          <p className="text-sm text-gray-500">Đọc to từ để luyện phát âm</p>
          <button
            onClick={() => { if (isActive) { az.stop(); } else { az.reset(); az.start(); } }}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-white text-2xl shadow-lg transition-colors ${
              isActive ? "bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isActive ? "⏹" : "🎤"}
          </button>
          {isListening && <p className="text-sm text-blue-600 italic">Đang nghe…</p>}
          {az.status === "processing" && <p className="text-sm text-blue-500 italic">Đang phân tích…</p>}

          <div className="flex gap-3 mt-1">
            <Button variant="danger" size="sm" onClick={() => onSubmit(false)}>❌ Khó</Button>
            <Button variant="primary" size="sm" onClick={() => onSubmit(true)}>✅ Dễ</Button>
          </div>
        </>
      )}

      {isDone && az.score !== null && (
        <>
          <ScoreBadge score={score} />
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" size="sm" onClick={() => az.reset()}>🔄 Đọc lại</Button>
            <Button variant="danger" size="sm" onClick={() => onSubmit(false)}>😓 Khó</Button>
            <Button variant="primary" size="sm" onClick={() => onSubmit(score >= 70)}>
              {score >= 70 ? "😊 Dễ — tiếp theo →" : "😓 Tiếp theo →"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function FlashCard({ words, userLevel, onComplete }: FlashCardProps) {
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState<string | null>(null);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [key, setKey] = useState(0); // force re-mount PronunciationSection on next word

  const currentWord = words[index];
  const isLast = index === words.length - 1;

  useEffect(() => {
    if (!currentWord) return;
    if (currentWord.exampleSentence) { setSentence(currentWord.exampleSentence); return; }
    setSentence(null);
    setLoadingSentence(true);
    fetch(`/api/vocab/example?word=${encodeURIComponent(currentWord.word)}&level=${userLevel}`)
      .then(r => r.json())
      .then(d => setSentence(d.sentence ?? null))
      .catch(() => {})
      .finally(() => setLoadingSentence(false));
  }, [currentWord, userLevel]);

  async function submitResult(correct: boolean) {
    setSubmitting(true);
    await fetch("/api/vocab/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: currentWord.id, correct }),
    }).catch(() => {});
    setSubmitting(false);
    if (isLast) { onComplete(); return; }
    setIndex(i => i + 1);
    setKey(k => k + 1);
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(index / words.length) * 100}%` }} />
        </div>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      <WordCard word={currentWord.word} sentence={sentence} loadingSentence={loadingSentence} />

      {submitting ? (
        <div className="flex justify-center"><Spinner /></div>
      ) : (
        <PronunciationSection key={key} word={currentWord} onSubmit={submitResult} />
      )}
    </div>
  );
}
