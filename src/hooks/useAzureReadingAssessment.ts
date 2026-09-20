"use client";

import { useCallback, useRef, useState } from "react";
import { normalizeText } from "@/lib/textComparison";

export interface AzureWordScore {
  accuracyScore: number;
  errorType: "None" | "Mispronunciation" | "Omission" | "Insertion" | string;
  phonemes: { phoneme: string; score: number; actual?: string }[];
}

export interface AzureReadingResult {
  wordScores: AzureWordScore[];         // indexed by passage word position
  pronunciationScore: number;
  fluencyScore: number;
  completenessScore: number;
  accuracyScore: number;
}

type Status = "idle" | "listening" | "done" | "error" | "unconfigured";

export function useAzureReadingAssessment(passage: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AzureReadingResult | null>(null);
  const recognizerRef = useRef<{ stopContinuousRecognitionAsync: (cb: () => void, errCb: (e: string) => void) => void; close: () => void } | null>(null);
  const chunksRef = useRef<{ word: string; accuracyScore: number; errorType: string; phonemes: { phoneme: string; score: number; actual?: string }[] }[]>([]);

  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  const start = useCallback(async () => {
    if (!key || !region) { setStatus("unconfigured"); return; }

    chunksRef.current = [];
    setResult(null);
    setStatus("listening");

    try {
      const SDK = await import("microsoft-cognitiveservices-speech-sdk");

      const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = "en-GB";
      speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000");
      speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");

      const audioConfig = SDK.AudioConfig.fromDefaultMicrophoneInput();

      // Use fromJSON to enable phoneme-level + NBestPhonemes (what user actually said)
      const pronunciationConfig = SDK.PronunciationAssessmentConfig.fromJSON(JSON.stringify({
        ReferenceText: passage,
        GradingSystem: "HundredMark",
        Granularity: "Phoneme",
        EnableMiscue: true,
        NBestPhonemeCount: 3,
      }));

      const recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      recognizerRef.current = recognizer;

      recognizer.recognized = (_, e) => {
        if (e.result.reason !== SDK.ResultReason.RecognizedSpeech) return;
        try {
          const pr = SDK.PronunciationAssessmentResult.fromResult(e.result);
          type RawPhoneme = { Phoneme: string; PronunciationAssessment?: { AccuracyScore?: number; NBestPhonemes?: { Phoneme: string; Score: number }[] } };
          type RawWord = { Word: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string }; Phonemes?: RawPhoneme[] };

          // Also try pronunciation-specific property (available in some regions)
          const paJsonStr = e.result.properties.getProperty("SpeechServiceResponse_PronunciationAssessmentResult");
          const paData = paJsonStr ? JSON.parse(paJsonStr) : null;
          const paWords: RawWord[] = paData?.Words ?? paData?.NBest?.[0]?.Words ?? [];
          const detailWords = (pr.detailResult?.Words ?? []) as unknown as RawWord[];
          const words = paWords.length > 0 ? paWords : detailWords;

          for (const w of words) {
            const phonemes = (w.Phonemes ?? []).map(p => ({
              phoneme: p.Phoneme ?? "",
              score: Math.round(p.PronunciationAssessment?.AccuracyScore ?? 0),
              actual: (() => {
                const best = p.PronunciationAssessment?.NBestPhonemes?.[0]?.Phoneme;
                return best && best !== p.Phoneme ? best : undefined;
              })(),
            }));
            chunksRef.current.push({
              word: w.Word ?? "",
              accuracyScore: Math.round(w.PronunciationAssessment?.AccuracyScore ?? 0),
              errorType: w.PronunciationAssessment?.ErrorType ?? "None",
              phonemes,
            });
          }
        } catch (err) {
          console.error("[Azure reading] parse error:", err);
        }
      };

      await recognizer.startContinuousRecognitionAsync();
    } catch (err) {
      console.error("[Azure reading] init error:", err);
      setStatus("error");
    }
  }, [key, region, passage]);

  const stop = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer) { setStatus("idle"); return; }

    // Clear ref immediately so nothing else can double-close
    recognizerRef.current = null;

    // close() is synchronous and reliable; stopContinuousRecognitionAsync hangs
    try { recognizer.close(); } catch { /* ignore */ }

    const wordScores = alignToPassage(passage, chunksRef.current);
    const scored = wordScores.filter(w => w.errorType !== "Omission");
    const avg = (arr: AzureWordScore[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((s, w) => s + w.accuracyScore, 0) / arr.length);

    setResult({
      wordScores,
      pronunciationScore: avg(scored),
      fluencyScore: 0,
      completenessScore: wordScores.length === 0 ? 0 : Math.round((scored.length / wordScores.length) * 100),
      accuracyScore: avg(scored),
    });
    setStatus("done");
  }, [passage]);

  const reset = useCallback(() => {
    recognizerRef.current?.close();
    recognizerRef.current = null;
    chunksRef.current = [];
    setStatus("idle");
    setResult(null);
  }, []);

  return { start, stop, reset, status, result };
}

// Align Azure's recognized words to passage word indices using sequential greedy match
function alignToPassage(
  passage: string,
  azureWords: { word: string; accuracyScore: number; errorType: string; phonemes: { phoneme: string; score: number; actual?: string }[] }[]
): AzureWordScore[] {
  const passageWords = normalizeText(passage).split(" ").filter(Boolean);
  const result: AzureWordScore[] = passageWords.map(() => ({
    accuracyScore: 0,
    errorType: "Omission",
    phonemes: [],
  }));

  let pi = 0;
  let ai = 0;

  while (ai < azureWords.length && pi < passageWords.length) {
    const aw = azureWords[ai].word.toLowerCase().replace(/[^a-z]/g, "");
    const pw = passageWords[pi];

    if (aw === pw || (aw.length > 0 && pw.startsWith(aw)) || (pw.length > 0 && aw.startsWith(pw))) {
      result[pi] = {
        accuracyScore: azureWords[ai].accuracyScore,
        errorType: azureWords[ai].errorType,
        phonemes: azureWords[ai].phonemes,
      };
      pi++;
      ai++;
    } else {
      // Try look-ahead in passage (skipped word)
      let found = false;
      for (let la = 1; la <= 3 && pi + la < passageWords.length; la++) {
        if (azureWords[ai].word.toLowerCase().replace(/[^a-z]/g, "") === passageWords[pi + la]) {
          pi += la;
          result[pi] = { accuracyScore: azureWords[ai].accuracyScore, errorType: azureWords[ai].errorType, phonemes: azureWords[ai].phonemes };
          pi++;
          ai++;
          found = true;
          break;
        }
      }
      if (!found) {
        // Azure inserted an extra word — skip it
        ai++;
      }
    }
  }

  return result;
}
