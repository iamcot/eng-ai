"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { useAzureReadingAssessment } from "@/hooks/useAzureReadingAssessment";
import { usePassageHistory, PassageEntry } from "@/hooks/usePassageHistory";
import { compareTexts, ComparisonResult, WordResult, normalizeText } from "@/lib/textComparison";
import { WordPracticeCard } from "@/components/reading/WordPracticeCard";
import { LEVELS, READING_TOPICS } from "@/lib/prompts";

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l }));
const TOPIC_OPTIONS = READING_TOPICS.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

export default function ReadingPage() {
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState<string>(READING_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [azureMode, setAzureMode] = useState(!!process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY);
  const [resultTab, setResultTab] = useState<"tts" | "azure">("tts");
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
  const azureStopRef = useRef<() => void>(() => {});
  const activePassageIdRef = useRef<string | null>(null); // DB passageId
  const levelRef = useRef(level);
  const topicRef = useRef(topic);
  const azureSavedRef = useRef(false);

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

    // Auto-add wrong words to vocab bank
    const wrongWords = result.words
      .filter(w => w.status === "wrong")
      .map(w => w.word.toLowerCase().replace(/[^a-z]/g, "").trim())
      .filter(Boolean);
    if (wrongWords.length > 0) {
      fetch("/api/vocab/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: wrongWords }),
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
      stopRef.current();
      stopAudioRef.current();
      azureStopRef.current();
    }
  }, [finalize]);

  const { audioUrl, startRecording, stopRecording, clearRecording, addWordTimestamps, playWordClip } = useAudioRecorder();

  const { state, isSupported, interimTranscript, errorMessage, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({ onInterimTranscript: handleInterim, onFinalTranscript: handleFinal, lang: "en-US", continuous: true });

  const azureAssessment = useAzureReadingAssessment(passageRef.current ?? "");

  stopRef.current = stopListening;
  stopAudioRef.current = stopRecording;
  azureStopRef.current = azureMode ? azureAssessment.stop : () => {};
  const isRecording = state === "listening";

  async function generatePassage() {
    const activeTopic = isCustomTopic ? customTopic.trim() : topic;
    if (!activeTopic) { setGenerateError("Please enter a topic."); return; }
    setGenerateError("");
    setIsGenerating(true);
    setPassage(null);
    setComparison(null);
    setLiveComparison(null);
    accumulatedRef.current = "";
    passageRef.current = null;
    azureSavedRef.current = false;
    resetTranscript();
    levelRef.current = level;
    topicRef.current = activeTopic;

    try {
      const res = await fetch("/api/passages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic: activeTopic }),
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
    azureSavedRef.current = false;
    setComparison(null);
    setLiveComparison(null);
    setInterimDisplay("");
    setResultTab("tts");
    clearRecording();
    resetTranscript();
    azureAssessment.reset();
    await startRecording();
    startListening();
    // Azure starts simultaneously so it captures the same audio session
    if (azureMode && passageRef.current) azureAssessment.start();
  }

  function handleStopRecording() {
    stopListening();
    stopRecording();
    if (azureMode) azureAssessment.stop();
    if (accumulatedRef.current.trim()) finalize(accumulatedRef.current);
  }

  function handleReset() {
    if (isRecording) { stopListening(); stopRecording(); }
    azureAssessment.reset();
    setResultTab("tts");
    accumulatedRef.current = "";
    setComparison(null);
    setLiveComparison(null);
    setInterimDisplay("");
    resetTranscript();
  }

  // Merge Azure pronunciation scores into comparison result when available
  const mergedComparison: typeof comparison = (() => {
    const base = comparison;
    if (!base || !azureAssessment.result) return base;
    const wordScores = azureAssessment.result.wordScores;
    const words: WordResult[] = base.words.map((w, i) => {
      const az = wordScores[i];
      if (!az) return w;
      return {
        ...w,
        accuracyScore: az.accuracyScore,
        phonemes: az.phonemes,
        status: az.errorType === "Omission" ? "missed" : w.status,
      };
    });
    const scoredWords = words.filter(w => w.accuracyScore !== undefined);
    const avgScore = scoredWords.length > 0
      ? Math.round(scoredWords.reduce((s, w) => s + (w.accuracyScore ?? 0), 0) / scoredWords.length)
      : base.score;
    return { ...base, words, score: avgScore };
  })();

  // Save Azure result to history when it arrives (overwrites TTS score)
  useEffect(() => {
    const result = azureAssessment.result;
    const pid = activePassageIdRef.current;
    if (!result || !pid || !comparison || azureSavedRef.current) return;
    azureSavedRef.current = true;

    const merged = comparison.words.map((w, i) => {
      const az = result.wordScores[i];
      if (!az) return w;
      return { ...w, accuracyScore: az.accuracyScore, phonemes: az.phonemes,
        status: az.errorType === "Omission" ? "missed" as const : w.status };
    });

    updateScore(pid, result.pronunciationScore, merged);
    fetch("/api/sessions/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "READING", level: levelRef.current, topic: topicRef.current,
        score: result.pronunciationScore, passageId: pid, resultJson: JSON.stringify(merged),
      }),
    }).catch(() => {});
  }, [azureAssessment.result, comparison, updateScore]);

  // live: always TTS; after stop: pick by tab
  const displayComparison = isRecording
    ? (liveComparison ?? comparison)
    : resultTab === "azure" && mergedComparison
      ? mergedComparison
      : (comparison ?? mergedComparison);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📖 Luyện đọc</h1>
        <p className="mt-1 text-gray-600">
          Đọc to đoạn văn. Từng từ được highlight khi bạn đọc — đọc xong hoặc nhấn dừng để xem kết quả.
        </p>
      </div>

      <BrowserSupportCheck>
        <div className="flex gap-6 items-start">
          {/* Main area */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <Card padding="sm">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-medium text-gray-600">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Topic — dropdown or free text */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-medium text-gray-600">Topic</label>
                    <button
                      type="button"
                      onClick={() => { setIsCustomTopic(v => !v); setGenerateError(""); }}
                      className={`text-xs px-1.5 py-0.5 rounded transition-colors border ${isCustomTopic ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-400 border-gray-200 hover:border-blue-400"}`}
                    >
                      ✏️
                    </button>
                  </div>
                  {isCustomTopic ? (
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g. AI in medicine"
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                    />
                  ) : (
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {TOPIC_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                <Button size="sm" onClick={generatePassage} isLoading={isGenerating} disabled={isRecording}>
                  Tạo bài đọc
                </Button>

                {/* Azure pronunciation toggle */}
                {process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none self-end pb-1.5">
                    <div
                      className={`relative w-7 h-4 rounded-full transition-colors ${azureMode ? "bg-blue-500" : "bg-gray-300"}`}
                      onClick={() => setAzureMode(v => !v)}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${azureMode ? "translate-x-3" : ""}`}/>
                    </div>
                    <span className="text-xs text-gray-500">🎯 Phát âm chi tiết</span>
                  </label>
                )}
              </div>
              {generateError && <p className="mt-3 text-sm text-red-600">{generateError}</p>}
            </Card>

            {/* Controls — always accessible when passage is loaded */}
            {passage && (
              <div className="flex items-center gap-2">
                <RecordButton isRecording={isRecording} isSupported={isSupported} onStart={handleStartRecording} onStop={handleStopRecording} disabled={isGenerating} />
                <SpeakButton text={passage} disabled={isRecording || isGenerating} />
                {(comparison || liveComparison) && !isRecording && (
                  <Button variant="secondary" size="sm" onClick={handleReset}>Thử lại</Button>
                )}
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-3 text-gray-500"><Spinner /><span>Đang tạo đoạn văn…</span></div>
            )}

            {passage && (
              <>
                {/* 1. Tab bar — top, always visible when azureMode */}
                {azureMode && (
                  <div className="flex gap-1 border-b border-gray-200">
                    <button
                      onClick={() => setResultTab("tts")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${resultTab === "tts" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                      📝 Nhận diện từ
                    </button>
                    <button
                      onClick={() => setResultTab("azure")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${resultTab === "azure" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                      🎯 Phát âm chi tiết
                      {azureAssessment.status === "listening" && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"/>
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 2. Score section — between tab and passage, only after completion */}
                {comparison && !isRecording && (
                  (!azureMode || resultTab === "tts") ? (
                    <ScoreCard result={comparison} />
                  ) : azureAssessment.status === "listening" ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600 py-1">
                      <span className="animate-spin">⏳</span> Đang phân tích phát âm…
                    </div>
                  ) : azureAssessment.result ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex gap-3 flex-wrap text-sm">
                        <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                          Độ chính xác: <strong>{azureAssessment.result.pronunciationScore}</strong>/100
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                          Hoàn thành: <strong>{azureAssessment.result.completenessScore}%</strong>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex gap-3 flex-wrap">
                        <span>Màu trong đoạn văn phía trên:</span>
                        <span className="text-green-600 font-medium">xanh ≥85</span>
                        <span className="text-lime-600 font-medium">vàng ≥70</span>
                        <span className="text-amber-500 font-medium">cam ≥55</span>
                        <span className="text-red-600 font-medium">đỏ &lt;55</span>
                      </p>
                      {(() => {
                        const weak = (mergedComparison ?? comparison)?.words.filter(w => (w.accuracyScore ?? 100) < 85) ?? [];
                        if (weak.length === 0) return <p className="text-sm text-green-600">Tất cả từ phát âm tốt! 🎉</p>;
                        return (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Từ cần luyện thêm — nhấn để xem IPA:</p>
                            <div className="flex flex-wrap gap-2">
                              {weak.map((w, i) => {
                                const score = w.accuracyScore ?? 0;
                                const colorClass =
                                  score >= 70 ? "border-lime-300 bg-lime-50 text-lime-700"
                                  : score >= 55 ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-red-300 bg-red-50 text-red-700";
                                return (
                                  <WordPracticeCard
                                    key={i}
                                    word={w.word}
                                    colorClass={colorClass}
                                    phonemes={w.phonemes}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-1">Không có kết quả Azure.</p>
                  )
                )}

                {/* 3. Passage display */}
                <PassageDisplay passage={passage} wordResults={displayComparison?.words ?? null} isRecording={isRecording} hasRecording={!!audioUrl} onPlayWordClip={(idx) => playWordClip(idx, passage.split(/\s+/).filter(Boolean))} />

                {/* 4. STT status */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700 min-h-[2.25rem] flex items-center">
                  {isRecording ? (
                    <><span className="font-medium mr-1">Đang nghe:</span>
                      <span>{interimDisplay || interimTranscript || <span className="italic text-blue-400">đang lắng nghe…</span>}</span></>
                  ) : (
                    <span className="text-blue-300 italic">Nhấn thu âm để bắt đầu</span>
                  )}
                </div>

                {errorMessage && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
                )}

                {/* Playback */}
                {audioUrl && !isRecording && (
                  <div className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🎙</span>
                      <span className="font-medium">Bản ghi âm của bạn</span>
                      <span className="text-xs text-gray-400">— nhấn từ đỏ để nghe lại</span>
                    </div>
                    <audio controls src={audioUrl} className="w-full h-8" />
                  </div>
                )}
              </>
            )}

            {!passage && !isGenerating && (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div>
                  <div className="text-4xl mb-3">📖</div>
                  <p className="text-gray-500">Tạo đoạn văn mới hoặc chọn từ lịch sử →</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-60 shrink-0 flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-700">Lịch sử đọc</h3>
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
