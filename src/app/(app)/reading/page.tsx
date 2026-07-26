"use client";

import { useState, useCallback, useRef } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PassageDisplay } from "@/components/reading/PassageDisplay";
import { RecordButton } from "@/components/reading/RecordButton";
import { SpeakButton } from "@/components/reading/SpeakButton";
import { ScoreCard } from "@/components/reading/ScoreCard";
import { PassageHistory } from "@/components/reading/PassageHistory";
import { BrowserSupportCheck } from "@/components/shared/BrowserSupport";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { usePassageHistory, PassageEntry } from "@/hooks/usePassageHistory";
import { compareTexts, ComparisonResult, WordResult, normalizeText } from "@/lib/textComparison";
import { LEVELS, READING_TOPICS } from "@/lib/prompts";

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l }));
const TOPIC_OPTIONS = READING_TOPICS.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

export default function ReadingPage() {
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState<string>(READING_TOPICS[0]);
  const [passage, setPassage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [liveComparison, setLiveComparison] = useState<ComparisonResult | null>(null);
  const [interimDisplay, setInterimDisplay] = useState("");

  const { history, loading: historyLoading, addPassage, updateScore, removePassage } = usePassageHistory();

  const passageRef = useRef<string | null>(null);
  const passageWordCountRef = useRef(0);
  const accumulatedRef = useRef("");
  const stopRef = useRef<() => void>(() => {});
  const stopAudioRef = useRef<() => void>(() => {});
  const activePassageIdRef = useRef<string | null>(null); // DB passageId
  const levelRef = useRef(level);
  const topicRef = useRef(topic);

  const finalize = useCallback((text: string) => {
    const p = passageRef.current;
    if (!p || !text.trim()) return;
    console.log("[Reading] finalizing with:", text);
    const result = compareTexts(p, text);
    setComparison(result);
    setLiveComparison(null);
    setInterimDisplay("");

    const pid = activePassageIdRef.current;
    if (pid) {
      updateScore(pid, result.score, result.words);
      fetch("/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "READING",
          level: levelRef.current,
          topic: topicRef.current,
          score: result.score,
          passageId: pid,
          resultJson: JSON.stringify(result.words),
        }),
      }).catch(() => {});
    }
  }, [updateScore]);

  const handleInterim = useCallback((interim: string) => {
    const p = passageRef.current;
    if (!p) return;
    setInterimDisplay(interim);
    const combined = (accumulatedRef.current + " " + interim).trim();
    const result = compareTexts(p, combined);
    setLiveComparison(result);
  }, []);

  const handleFinal = useCallback((text: string) => {
    const p = passageRef.current;
    if (!p) return;
    accumulatedRef.current = (accumulatedRef.current + " " + text).trim();

    // Record timestamps for words in this STT result
    const words = text.trim().split(/\s+/).filter(Boolean);
    addWordTimestamps(words, performance.now());
    const result = compareTexts(p, accumulatedRef.current);
    setLiveComparison(result);
    setInterimDisplay("");

    const attempted = result.words.filter((w) => w.status !== "pending").length;
    const total = passageWordCountRef.current;
    console.log(`[Reading] ${attempted}/${total} words attempted`);

    if (attempted >= total) {
      console.log("[Reading] all words covered, auto-stopping");
      finalize(accumulatedRef.current);
      stopRef.current();     // stop STT
      stopAudioRef.current(); // stop audio recording
    }
  }, [finalize]);

  const { audioUrl, startRecording, stopRecording, clearRecording, addWordTimestamps, playWordClip } = useAudioRecorder();

  const { state, isSupported, interimTranscript, errorMessage, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({ onInterimTranscript: handleInterim, onFinalTranscript: handleFinal, lang: "en-US", continuous: true });

  stopRef.current = stopListening;
  stopAudioRef.current = stopRecording;
  const isRecording = state === "listening";

  async function generatePassage() {
    setGenerateError("");
    setIsGenerating(true);
    setPassage(null);
    setComparison(null);
    setLiveComparison(null);
    accumulatedRef.current = "";
    passageRef.current = null;
    resetTranscript();
    levelRef.current = level;
    topicRef.current = topic;

    try {
      const res = await fetch("/api/passages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const words = normalizeText(data.passage).split(" ").filter(Boolean);
      passageWordCountRef.current = words.length;
      passageRef.current = data.passage;
      activePassageIdRef.current = data.passageId;

      addPassage(data.passage, level, topic, data.passageId);
      setActiveId(data.passageId);
      setPassage(data.passage);
      console.log("[Reading] passage loaded,", words.length, "words", data.fromPool ? "(from pool)" : "(AI generated)");
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Failed to generate passage");
    } finally {
      setIsGenerating(false);
    }
  }

  function loadFromHistory(entry: PassageEntry, replayWords?: WordResult[] | null, replayScore?: number) {
    if (isRecording) stopListening();
    accumulatedRef.current = "";
    passageRef.current = entry.passage;
    passageWordCountRef.current = normalizeText(entry.passage).split(" ").filter(Boolean).length;
    activePassageIdRef.current = entry.passageId;
    levelRef.current = entry.level;
    topicRef.current = entry.topic;

    setPassage(entry.passage);
    setActiveId(entry.passageId);
    setLevel(entry.level);
    setTopic(entry.topic);
    setComparison(replayWords ? {
      words: replayWords,
      score: replayScore ?? entry.latestScore ?? 0,
      correctCount: replayWords.filter(w => w.status === "correct").length,
      totalCount: replayWords.filter(w => w.status !== "pending").length,
    } : null);
    setLiveComparison(null);
    setInterimDisplay("");
    resetTranscript();
  }

  async function handleStartRecording() {
    accumulatedRef.current = "";
    setComparison(null);
    setLiveComparison(null);
    setInterimDisplay("");
    clearRecording();
    resetTranscript();
    await startRecording();
    console.log("[Reading] audio recording started");
    startListening();
  }

  function handleStopRecording() {
    stopListening();
    stopRecording();
    console.log("[Reading] audio recording stopped, audioUrl will be set async");
    if (accumulatedRef.current.trim()) finalize(accumulatedRef.current);
  }

  function handleReset() {
    if (isRecording) { stopListening(); stopRecording(); }
    accumulatedRef.current = "";
    setComparison(null);
    setLiveComparison(null);
    setInterimDisplay("");
    // Don't clear recording — keep audio for playback until user starts new recording
    resetTranscript();
  }

  const displayComparison = liveComparison ?? comparison;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📖 Reading Practice</h1>
        <p className="mt-1 text-gray-600">
          Read the passage aloud. Words highlight as you speak — finish or press stop to see results.
        </p>
      </div>

      <BrowserSupportCheck>
        <div className="flex gap-6 items-start">
          {/* Main area */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <Card>
              <div className="flex flex-wrap items-end gap-4">
                <Select label="Level" options={LEVEL_OPTIONS} value={level} onChange={(e) => setLevel(e.target.value)} />
                <Select label="Topic" options={TOPIC_OPTIONS} value={topic} onChange={(e) => setTopic(e.target.value)} />
                <Button onClick={generatePassage} isLoading={isGenerating} disabled={isRecording}>
                  Generate New Passage
                </Button>
              </div>
              {generateError && <p className="mt-3 text-sm text-red-600">{generateError}</p>}
            </Card>

            {isGenerating && (
              <div className="flex items-center gap-3 text-gray-500"><Spinner /><span>Generating passage…</span></div>
            )}

            {passage && (
              <>
                <PassageDisplay passage={passage} wordResults={displayComparison?.words ?? null} isRecording={isRecording} hasRecording={!!audioUrl} onPlayWordClip={(idx) => playWordClip(idx, passage.split(/\s+/).filter(Boolean))} />

                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700 min-h-[2.25rem] flex items-center">
                  {isRecording ? (
                    <><span className="font-medium mr-1">Hearing:</span>
                      <span>{interimDisplay || interimTranscript || <span className="italic text-blue-400">listening…</span>}</span></>
                  ) : (
                    <span className="text-blue-300 italic">Press record to start</span>
                  )}
                </div>

                {errorMessage && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
                )}

                <div className="flex items-center gap-3">
                  <RecordButton isRecording={isRecording} isSupported={isSupported} onStart={handleStartRecording} onStop={handleStopRecording} disabled={isGenerating} />
                  <SpeakButton text={passage} disabled={isRecording || isGenerating} />
                  {(comparison || liveComparison) && !isRecording && (
                    <Button variant="secondary" onClick={handleReset}>Try Again</Button>
                  )}
                </div>

                {/* Playback — show right after controls */}
                {audioUrl && !isRecording && (
                  <div className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🎙</span>
                      <span className="font-medium">Your recording</span>
                      <span className="text-xs text-gray-400">— click a red word to hear that part</span>
                    </div>
                    <audio controls src={audioUrl} className="w-full h-8" />
                  </div>
                )}

                {comparison && !isRecording && <ScoreCard result={comparison} />}
              </>
            )}

            {!passage && !isGenerating && (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div>
                  <div className="text-4xl mb-3">📖</div>
                  <p className="text-gray-500">Generate a new passage or pick one from history →</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-60 shrink-0 flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-700">History</h3>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400"><Spinner size="sm" />Loading…</div>
            ) : (
              <PassageHistory
                history={history}
                activeId={activeId}
                onSelect={loadFromHistory}
                onDelete={removePassage}
              />
            )}
          </div>
        </div>
      </BrowserSupportCheck>
    </div>
  );
}
