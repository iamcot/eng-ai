"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { isMatch, normalizeText } from "@/lib/textComparison";

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
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean}`)
      .then(r => r.json())
      .then(json => {
        const found =
          json?.[0]?.phonetic ||
          json?.[0]?.phonetics?.find((p: { text?: string }) => p.text)?.text ||
          null;
        setIpa(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [word]);
  return { ipa, loading };
}

function speak(text: string, slow = false) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = slow ? 0.65 : 0.9;
  window.speechSynthesis.speak(u);
}

export function WordDetailSheet({ word, userLevel, onClose, onAttempt }: WordDetailSheetProps) {
  const [sentence, setSentence] = useState<string | null>(word.exampleSentence);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [heardWord, setHeardWord] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { ipa, loading: ipaLoading } = useIPA(word.word);

  // Fetch sentence if not cached
  useEffect(() => {
    if (word.exampleSentence || sentence) return;
    setLoadingSentence(true);
    fetch(`/api/vocab/example?word=${encodeURIComponent(word.word)}&level=${userLevel}`)
      .then(r => r.json())
      .then(d => setSentence(d.sentence ?? null))
      .catch(() => {})
      .finally(() => setLoadingSentence(false));
  }, [word, userLevel, sentence]);

  const handleFinal = (text: string) => {
    const words = normalizeText(text).split(" ").filter(Boolean);
    const matched = words.some(w => isMatch(word.word, w));
    setHeardWord(text.trim());
    setResult(matched ? "correct" : "wrong");
    stopListening();
  };

  const { state, startListening, stopListening, resetTranscript, interimTranscript } =
    useSpeechRecognition({ onFinalTranscript: handleFinal, lang: "en-US", continuous: false });

  const isListening = state === "listening";

  async function submitAttempt(correct: boolean) {
    setSubmitting(true);
    await fetch("/api/vocab/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, correct }),
    }).catch(() => {});
    onAttempt(word.id, correct);
    setSubmitting(false);
    setResult(null);
    setHeardWord("");
    resetTranscript();
  }

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
              <button onClick={() => speak(word.word)} className="text-gray-400 hover:text-blue-600 text-xl" title="Normal speed">🔊</button>
              <button onClick={() => speak(word.word, true)} className="text-gray-400 hover:text-blue-600 text-lg" title="Slow">🐢</button>
            </div>
            {/* IPA */}
            <div className="h-5 flex items-center">
              {ipaLoading ? (
                <Spinner size="sm" />
              ) : ipa ? (
                <span className="text-gray-500 font-mono text-sm">{ipa}</span>
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
          <p className="text-sm font-medium text-gray-700">Practice pronunciation:</p>

          {/* Mic button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isListening) { stopListening(); return; }
                setResult(null); setHeardWord(""); resetTranscript();
                startListening();
              }}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-xl shadow transition-colors ${
                isListening ? "bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
              }`}
              title={isListening ? "Stop" : "Speak"}
            >
              {isListening ? "⏹" : "🎤"}
            </button>
            <div className="flex-1 text-sm">
              {isListening ? (
                <span className="text-blue-600">{interimTranscript || <span className="italic">Listening…</span>}</span>
              ) : result === null ? (
                <span className="text-gray-400">Tap the mic and say the word</span>
              ) : (
                <div className={`rounded-lg px-3 py-2 ${result === "correct" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <span className="font-medium">{result === "correct" ? "✅ Correct!" : "❌ Not quite"}</span>
                  {heardWord && <span className="ml-1 text-sm">— heard: "{heardWord}"</span>}
                </div>
              )}
            </div>
          </div>

          {/* Rate buttons */}
          {result !== null && (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" className="flex-1" onClick={() => submitAttempt(false)} disabled={submitting}>
                😓 Hard — review soon
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => submitAttempt(true)} disabled={submitting} isLoading={submitting}>
                😊 Easy — got it!
              </Button>
            </div>
          )}
        </div>

        {/* SR info */}
        <p className="text-xs text-gray-400 text-center">
          Current interval: {word.interval} day{word.interval !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
