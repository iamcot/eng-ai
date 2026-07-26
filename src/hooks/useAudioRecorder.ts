"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface WordTimestamp {
  word: string;      // normalized word
  startSec: number;  // seconds from recording start
  endSec: number;
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  const audioBlobRef = useRef<Blob | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null); // sync ref for playback
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // Timestamps added by reading page when STT final results arrive
  const wordTimestampsRef = useRef<WordTimestamp[]>([]);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      wordTimestampsRef.current = [];
      startTimeRef.current = performance.now();

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        console.log("[AudioRecorder] onstop, blob size:", blob.size, "chunks:", chunksRef.current.length);
        audioBlobRef.current = blob;
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        console.log("[AudioRecorder] audioUrl set:", url.slice(0, 40));
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      console.error("[AudioRecorder] failed to start");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      endTimeRef.current = performance.now();
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const clearRecording = useCallback(() => {
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    audioUrlRef.current = null;
    setAudioBlob(null);
    audioBlobRef.current = null;
    wordTimestampsRef.current = [];
  }, []);

  // Called by reading page when a final STT result arrives
  // words: array of words in this result, receivedAt: performance.now() when it fired
  const addWordTimestamps = useCallback((words: string[], receivedAtMs: number) => {
    if (!startTimeRef.current) return;
    const endSec = (receivedAtMs - startTimeRef.current) / 1000;
    const count = words.length;
    // Estimate: words were spoken evenly in the ~2s window before receivedAt
    const windowSec = Math.min(2.5, endSec);
    const startSec = Math.max(0, endSec - windowSec);
    const perWord = windowSec / count;

    const newTimestamps: WordTimestamp[] = words.map((w, i) => ({
      word: w.toLowerCase().replace(/[^a-z]/g, ""),
      startSec: startSec + i * perWord,
      endSec: startSec + (i + 1) * perWord,
    }));
    wordTimestampsRef.current = [...wordTimestampsRef.current, ...newTimestamps];
  }, []);

  // Play a ~2s clip of the recording starting at the given word index in passage
  const playWordClip = useCallback((wordIndex: number, passageWords: string[]) => {
    const url = audioUrlRef.current;
    if (!url) { console.warn("[playWordClip] no audioUrl"); return; }

    // Simple linear estimate: divide total recording duration by passage word count
    // More reliable than STT-timestamp windows which are too short
    const allTs = wordTimestampsRef.current;
    const totalRecordedSec = endTimeRef.current > startTimeRef.current
      ? (endTimeRef.current - startTimeRef.current) / 1000
      : allTs.length > 0 ? allTs[allTs.length - 1].endSec : 30;

    const totalWords = passageWords.length;
    const secPerWord = totalRecordedSec / Math.max(totalWords, 1);
    const estimatedStart = Math.max(0, wordIndex * secPerWord - 0.3);

    console.log("[playWordClip] word:", passageWords[wordIndex], "index:", wordIndex, "/", totalWords, "startSec:", estimatedStart.toFixed(2), "totalSec:", totalRecordedSec.toFixed(2));
    playClip(url, estimatedStart, 2.5);
  }, []);

  return {
    audioUrl,
    audioBlob,
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    clearRecording,
    addWordTimestamps,
    playWordClip,
    wordTimestamps: wordTimestampsRef,
  };
}

// Shared audio element for word clips — avoids reload lag
let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioSrc = "";
let clipStopTimer: ReturnType<typeof setTimeout> | null = null;

function playClip(url: string, startSec: number, duration: number) {
  if (typeof window === "undefined") return;
  console.log("[playClip] url:", url.slice(0, 40), "startSec:", startSec.toFixed(2));

  if (clipStopTimer) { clearTimeout(clipStopTimer); clipStopTimer = null; }

  if (!sharedAudio || sharedAudioSrc !== url) {
    if (sharedAudio) { sharedAudio.pause(); }
    sharedAudio = new Audio(url);
    sharedAudioSrc = url;
  }

  sharedAudio.pause();
  sharedAudio.currentTime = startSec;
  sharedAudio.play().then(() => {
    console.log("[playClip] playing OK");
  }).catch((e) => {
    console.error("[playClip] play failed:", e);
  });
  clipStopTimer = setTimeout(() => {
    sharedAudio?.pause();
  }, duration * 1000);
}
