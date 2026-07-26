"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { isMatch, normalizeText } from "@/lib/textComparison";

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

type CardState = "show" | "listening" | "result";

export function FlashCard({ words, userLevel, onComplete }: FlashCardProps) {
  const [index, setIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>("show");
  const [heardWord, setHeardWord] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [sentence, setSentence] = useState<string | null>(null);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentWord = words[index];
  const isLast = index === words.length - 1;

  // Load example sentence — use cached value if already in word data
  useEffect(() => {
    if (!currentWord) return;
    if (currentWord.exampleSentence) {
      setSentence(currentWord.exampleSentence);
      return;
    }
    setSentence(null);
    setLoadingSentence(true);
    fetch(`/api/vocab/example?word=${encodeURIComponent(currentWord.word)}&level=${userLevel}`)
      .then(r => r.json())
      .then(d => setSentence(d.sentence ?? null))
      .catch(() => {})
      .finally(() => setLoadingSentence(false));
  }, [currentWord, userLevel]);

  const handleFinal = useCallback((text: string) => {
    const words_in_text = normalizeText(text).split(" ").filter(Boolean);
    const matched = words_in_text.some(w => isMatch(currentWord.word, w));
    setHeardWord(text.trim());
    setCorrect(matched);
    setCardState("result");
    stopListening();
  }, [currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  const { state, startListening, stopListening, resetTranscript, interimTranscript } =
    useSpeechRecognition({ onFinalTranscript: handleFinal, lang: "en-US", continuous: false });

  const isListening = state === "listening";

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  async function submitResult(isCorrect: boolean) {
    setSubmitting(true);
    await fetch("/api/vocab/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: currentWord.id, correct: isCorrect }),
    }).catch(() => {});
    setSubmitting(false);

    if (isLast) {
      onComplete();
    } else {
      setIndex(i => i + 1);
      setCardState("show");
      setHeardWord("");
      setCorrect(null);
      resetTranscript();
    }
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((index) / words.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {/* Word */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <h2 className="text-4xl font-bold text-gray-900">{currentWord.word}</h2>
          <button
            onClick={() => speak(currentWord.word)}
            className="text-gray-400 hover:text-blue-600 text-xl"
            title="Listen"
          >🔊</button>
        </div>

        {/* Example sentence */}
        <div className="min-h-[3rem] flex items-center justify-center">
          {loadingSentence ? (
            <Spinner size="sm" />
          ) : sentence ? (
            <p className="text-gray-600 italic text-lg">
              {sentence.split(new RegExp(`(${currentWord.word})`, "gi")).map((part, i) =>
                part.toLowerCase() === currentWord.word.toLowerCase()
                  ? <strong key={i} className="text-blue-700 not-italic">{part}</strong>
                  : <span key={i}>{part}</span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">No example available</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {cardState === "show" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">Say the word aloud to practice pronunciation</p>
          <button
            onClick={() => { resetTranscript(); setCardState("listening"); startListening(); }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl shadow-lg hover:bg-blue-700 transition-colors"
          >🎤</button>
          <div className="flex gap-3 mt-2">
            <Button variant="danger" size="sm" onClick={() => submitResult(false)} disabled={submitting}>
              ❌ Hard
            </Button>
            <Button variant="primary" size="sm" onClick={() => submitResult(true)} disabled={submitting}>
              ✅ Easy
            </Button>
          </div>
        </div>
      )}

      {cardState === "listening" && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => { stopListening(); setCardState("show"); }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white text-2xl shadow-lg animate-pulse"
          >⏹</button>
          <p className="text-sm text-blue-600">
            {interimTranscript || <span className="italic">Listening…</span>}
          </p>
        </div>
      )}

      {cardState === "result" && correct !== null && (
        <div className="flex flex-col items-center gap-4">
          <div className={`rounded-xl px-6 py-4 text-center ${correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <p className="text-2xl mb-1">{correct ? "✅ Correct!" : "❌ Not quite"}</p>
            <p className="text-sm text-gray-600">
              You said: <strong>"{heardWord}"</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" size="sm" onClick={() => submitResult(false)} disabled={submitting}>
              Mark Hard
            </Button>
            <Button variant="primary" size="sm" onClick={() => submitResult(correct)} disabled={submitting} isLoading={submitting}>
              {isLast ? "Finish" : "Next →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
