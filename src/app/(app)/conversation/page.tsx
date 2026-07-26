"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ChatBubble } from "@/components/conversation/ChatBubble";
import { MicButton } from "@/components/conversation/MicButton";
import { BrowserSupportCheck } from "@/components/shared/BrowserSupport";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { compareTexts, WordResult } from "@/lib/textComparison";
import { LEVELS, CONVERSATION_TOPICS } from "@/lib/prompts";
import { ScenarioContext } from "@/types";

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l }));
const TOPIC_OPTIONS = CONVERSATION_TOPICS.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

const MAX_TURNS = 10;
const STORAGE_KEY = "engai_conversation_state";

interface Message {
  role: "user" | "assistant";
  content: string;
  detectedSpeech?: string;
  pronunciationIssues?: WordResult[];
}

interface PersistedState {
  scenario: ScenarioContext;
  messages: Message[];
  userTurnCount: number;
  sessionEnded: boolean;
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function ConversationPage() {
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState<string>(CONVERSATION_TOPICS[0]);
  const [scenario, setScenario] = useState<ScenarioContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [startError, setStartError] = useState("");
  const [userTurnCount, setUserTurnCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const accumulatedSpeechRef = useRef("");
  const autoSpeakRef = useRef(true);
  autoSpeakRef.current = autoSpeak;

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setScenario(saved.scenario);
      setMessages(saved.messages);
      setUserTurnCount(saved.userTurnCount);
      setSessionEnded(saved.sessionEnded);
    }
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (scenario) {
      saveState({ scenario, messages, userTurnCount, sessionEnded });
    }
  }, [scenario, messages, userTurnCount, sessionEnded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const submitSpeech = useCallback(
    async (speech: string) => {
      if (!scenario || !speech.trim() || isResponding) return;

      let pronunciationIssues: WordResult[] = [];
      const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
      if (lastAssistant) {
        const result = compareTexts(speech, speech);
        pronunciationIssues = result.words.filter(
          (w) => w.status === "wrong" || w.status === "missed"
        );
      }

      const userMsg: Message = { role: "user", content: speech, detectedSpeech: speech, pronunciationIssues };
      setMessages((prev) => [...prev, userMsg]);
      const newTurnCount = userTurnCount + 1;
      setUserTurnCount(newTurnCount);

      if (newTurnCount >= MAX_TURNS) {
        setSessionEnded(true);
        return;
      }

      setIsResponding(true);
      setStreamingText("");

      const historyForAPI = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/conversation/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userSpeech: speech, conversationHistory: historyForAPI, scenarioContext: scenario }),
        });

        if (!res.ok || !res.body) throw new Error("Failed to get response");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) { accumulated += parsed.text; setStreamingText(accumulated); }
              } catch { /* ignore */ }
            }
          }
        }

        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        setStreamingText("");

        if (autoSpeakRef.current && accumulated) speakText(accumulated);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
      } finally {
        setIsResponding(false);
      }
    },
    [scenario, messages, isResponding, userTurnCount]
  );

  const handleFinalTranscript = useCallback((text: string) => {
    accumulatedSpeechRef.current = (accumulatedSpeechRef.current + " " + text).trim();
  }, []);

  const { state, isSupported, interimTranscript, errorMessage, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({ onFinalTranscript: handleFinalTranscript, lang: "en-US", continuous: true });

  const isRecording = state === "listening";

  async function startConversation() {
    setStartError("");
    setIsStarting(true);
    try {
      const res = await fetch("/api/conversation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newScenario: ScenarioContext = {
        characterName: data.characterName,
        characterDescription: data.characterDescription,
        openingLine: data.openingLine,
        level,
        topic,
        sessionId: data.sessionId,
      };
      const firstMessage: Message = { role: "assistant", content: data.openingLine };

      setScenario(newScenario);
      setMessages([firstMessage]);
      setUserTurnCount(0);
      setSessionEnded(false);

      // Auto-speak opening line
      if (autoSpeakRef.current) speakText(data.openingLine);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Failed to start conversation");
    } finally {
      setIsStarting(false);
    }
  }

  function handleEndSession() {
    setSessionEnded(true);
    if (isRecording) stopListening();
    window.speechSynthesis?.cancel();
  }

  function handleNewConversation() {
    clearState();
    setScenario(null);
    setMessages([]);
    setUserTurnCount(0);
    setSessionEnded(false);
    setStreamingText("");
    resetTranscript();
    window.speechSynthesis?.cancel();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💬 Conversation Practice</h1>
        <p className="mt-1 text-gray-600">Have a real conversation with an AI character. Practice speaking naturally.</p>
      </div>

      <BrowserSupportCheck>
        {!scenario ? (
          /* Setup */
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Set up your conversation</h2>
              {/* Auto-speak toggle visible before starting too */}
              <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
                <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="rounded" />
                🔊 Auto-speak
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Select label="Your Level" options={LEVEL_OPTIONS} value={level} onChange={(e) => setLevel(e.target.value)} />
              <Select label="Scenario" options={TOPIC_OPTIONS} value={topic} onChange={(e) => setTopic(e.target.value)} />
              <Button onClick={startConversation} isLoading={isStarting} size="lg">Start Conversation</Button>
            </div>
            {startError && <p className="mt-3 text-sm text-red-600">{startError}</p>}
          </Card>
        ) : (
          /* Conversation */
          <div className="flex flex-col gap-4">
            {/* Scenario info bar */}
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{scenario.characterName}</span>
                  <span className="text-sm text-gray-500 ml-2">— {scenario.characterDescription}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                    <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="rounded" />
                    🔊 Auto-speak
                  </label>
                  <span className="text-xs text-gray-400">{userTurnCount}/{MAX_TURNS} turns</span>
                  {!sessionEnded && (
                    <Button variant="ghost" size="sm" onClick={handleEndSession}>End Session</Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Messages */}
            <div className="flex flex-col gap-3 min-h-[300px] max-h-[500px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  characterName={msg.role === "assistant" ? scenario.characterName : undefined}
                  detectedSpeech={msg.detectedSpeech}
                  pronunciationIssues={msg.pronunciationIssues}
                />
              ))}

              {streamingText && (
                <ChatBubble role="assistant" content={streamingText} characterName={scenario.characterName} isStreaming />
              )}

              {isResponding && !streamingText && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Spinner size="sm" /><span>{scenario.characterName} is typing…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {sessionEnded ? (
              <Card padding="sm" className="bg-blue-50 border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-3">
                  Great conversation! You completed {userTurnCount} turns.
                </p>
                <Button onClick={handleNewConversation}>Start New Conversation</Button>
              </Card>
            ) : (
              <div className="flex items-center gap-4">
                <MicButton
                  isRecording={isRecording}
                  isSupported={isSupported}
                  isDisabled={isResponding}
                  onStart={() => {
                    accumulatedSpeechRef.current = "";
                    resetTranscript();
                    startListening();
                  }}
                  onStop={() => {
                    stopListening();
                    const speech = accumulatedSpeechRef.current.trim();
                    accumulatedSpeechRef.current = "";
                    if (speech) submitSpeech(speech);
                  }}
                />
                <div className="flex-1">
                  {isRecording ? (
                    <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                      {interimTranscript || <span className="animate-pulse">Listening…</span>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {isResponding ? "Waiting for response…" : "Tap the mic to speak your response"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          </div>
        )}
      </BrowserSupportCheck>
    </div>
  );
}
