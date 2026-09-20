"use client";

import { useCallback, useRef, useState } from "react";

export type PronunciationStatus =
  | "idle"
  | "initializing"
  | "listening"
  | "processing"
  | "done"
  | "error"
  | "unconfigured";

interface PhonemeScore {
  phoneme: string;
  score: number;
}

interface UsePronunciationReturn {
  status: PronunciationStatus;
  score: number | null;
  phonemeScores: PhonemeScore[];
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useAzurePronunciation(referenceText: string): UsePronunciationReturn {
  const [status, setStatus] = useState<PronunciationStatus>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [phonemeScores, setPhonemeScores] = useState<PhonemeScore[]>([]);
  const recognizerRef = useRef<{ close: () => void } | null>(null);

  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  const start = useCallback(async () => {
    if (!key || !region) {
      setStatus("unconfigured");
      return;
    }

    setStatus("initializing");
    try {
      const SDK = await import("microsoft-cognitiveservices-speech-sdk");

      const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = "en-GB";
      // Give 8s for user to start speaking, stop 600ms after they finish
      speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "8000");
      speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000");

      const audioConfig = SDK.AudioConfig.fromDefaultMicrophoneInput();

      const pronunciationConfig = new SDK.PronunciationAssessmentConfig(
        referenceText,
        SDK.PronunciationAssessmentGradingSystem.HundredMark,
        SDK.PronunciationAssessmentGranularity.Phoneme,
        true
      );

      const recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      recognizerRef.current = recognizer;

      let speechStartMs = 0;

      recognizer.speechStartDetected = () => {
        speechStartMs = Date.now();
        console.log("[Azure] speech detected ✓");
        setStatus("processing");
      };
      recognizer.speechEndDetected = () => {
        const durationMs = speechStartMs ? Date.now() - speechStartMs : 0;
        console.log(`[Azure] speech end detected — duration: ${durationMs}ms`);
      };

      setStatus("listening");

      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          recognizerRef.current = null;

          // Azure sometimes returns NoMatch even when speech was detected and scored
          // (known SDK quirk with pronunciation assessment). Always try to parse first.
          try {
            const pr = SDK.PronunciationAssessmentResult.fromResult(result);
            const pronunciationScore = pr.pronunciationScore;

            console.log("[Azure] recognized:", result.text,
              "| reason:", result.reason,
              "| score:", pronunciationScore,
              "| ref:", referenceText);

            if (pronunciationScore != null) {
              setScore(Math.round(pronunciationScore));
              const phonemes: PhonemeScore[] = [];
              for (const word of pr.detailResult?.Words ?? []) {
                for (const ph of (word as { Phonemes?: { Phoneme: string; PronunciationAssessment?: { AccuracyScore: number } }[] }).Phonemes ?? []) {
                  phonemes.push({
                    phoneme: ph.Phoneme,
                    score: Math.round(ph.PronunciationAssessment?.AccuracyScore ?? 0),
                  });
                }
              }
              setPhonemeScores(phonemes);
              setStatus("done");
              return;
            }
          } catch {
            // fall through to reason check below
          }

          // No pronunciation data — log and return score 0
          console.warn("[Azure pronunciation] no score in result, reason:", result.reason);
          setScore(0);
          setPhonemeScores([]);
          setStatus("done");
        },
        (err) => {
          console.error("[Azure pronunciation] error:", err);
          setStatus("error");
          recognizer.close();
          recognizerRef.current = null;
        }
      );
    } catch (err) {
      console.error("[Azure pronunciation] init failed:", err);
      setStatus("error");
    }
  }, [key, region, referenceText]);

  const stop = useCallback(() => {
    recognizerRef.current?.close();
    recognizerRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    recognizerRef.current?.close();
    recognizerRef.current = null;
    setStatus("idle");
    setScore(null);
    setPhonemeScores([]);
  }, []);

  return { status, score, phonemeScores, start, stop, reset };
}
