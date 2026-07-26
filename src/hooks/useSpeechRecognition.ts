"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechState = "idle" | "listening" | "error" | "unsupported";

interface UseSpeechRecognitionOptions {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

interface UseSpeechRecognitionReturn {
  state: SpeechState;
  isSupported: boolean;
  interimTranscript: string;
  finalTranscript: string;
  errorMessage: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

function getSpeechRecognitionClass(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed": return "Microphone access denied. Please allow microphone access.";
    case "audio-capture": return "No microphone found.";
    case "network": return "Network error during speech recognition.";
    default: return `Speech error: ${error}`;
  }
}

// Fully destroy a recognition instance — null out all handlers before abort
// to prevent any callbacks firing after destruction.
function destroyRecognition(r: SpeechRecognition | null) {
  if (!r) return;
  r.onstart = null;
  r.onresult = null;
  r.onerror = null;
  r.onend = null;
  try { r.abort(); } catch { /* ignore */ }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", continuous = false } = options;

  const onInterimRef = useRef(options.onInterimTranscript);
  const onFinalRef = useRef(options.onFinalTranscript);
  useEffect(() => { onInterimRef.current = options.onInterimTranscript; }, [options.onInterimTranscript]);
  useEffect(() => { onFinalRef.current = options.onFinalTranscript; }, [options.onFinalTranscript]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<SpeechState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(getSpeechRecognitionClass() !== null);
  }, []);

  const createAndStart = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) { setState("unsupported"); return; }

    // Fully destroy previous instance before creating new one
    destroyRecognition(recognitionRef.current);
    recognitionRef.current = null;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[STT] started");
      setState("listening");
      setErrorMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (interim) {
        setInterimTranscript(interim);
        onInterimRef.current?.(interim);
      }
      if (final) {
        const trimmed = final.trim();
        console.log("[STT] final:", trimmed);
        setFinalTranscript((prev) => (prev + " " + trimmed).trim());
        setInterimTranscript("");
        onFinalRef.current?.(trimmed);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return; // normal silence, ignore
      if (event.error === "aborted") return;   // we triggered this, ignore
      console.error("[STT] error:", event.error);
      setState("error");
      setErrorMessage(getErrorMessage(event.error));
      wantListeningRef.current = false;
    };

    recognition.onend = () => {
      console.log("[STT] ended, wantListening:", wantListeningRef.current);
      if (!wantListeningRef.current) {
        setState("idle");
        return;
      }
      // Always create a FRESH instance when restarting — never reuse old one.
      // Small delay to let browser release mic fully between sessions.
      restartTimerRef.current = setTimeout(() => {
        if (wantListeningRef.current) {
          console.log("[STT] restarting with fresh instance");
          createAndStart();
        }
      }, 200);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("[STT] start failed:", e);
      setState("error");
      setErrorMessage("Failed to start microphone. Please try again.");
      wantListeningRef.current = false;
    }
  }, [lang, continuous]); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    wantListeningRef.current = true;
    createAndStart();
  }, [createAndStart]);

  const stopListening = useCallback(() => {
    console.log("[STT] stopping");
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    wantListeningRef.current = false;
    destroyRecognition(recognitionRef.current);
    recognitionRef.current = null;
    setState("idle");
  }, []);

  const resetTranscript = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    wantListeningRef.current = false;
    destroyRecognition(recognitionRef.current);
    recognitionRef.current = null;
    setFinalTranscript("");
    setInterimTranscript("");
    setErrorMessage(null);
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      wantListeningRef.current = false;
      destroyRecognition(recognitionRef.current);
    };
  }, []);

  return {
    state,
    isSupported,
    interimTranscript,
    finalTranscript: finalTranscript.trim(),
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
