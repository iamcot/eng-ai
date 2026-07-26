"use client";

import { WordResult } from "@/lib/textComparison";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  detectedSpeech?: string;
  pronunciationIssues?: WordResult[];
  isStreaming?: boolean;
}

export function ChatBubble({
  role,
  content,
  characterName,
  detectedSpeech,
  pronunciationIssues,
  isStreaming,
}: ChatBubbleProps) {
  const isUser = role === "user";

  const wrongWords = pronunciationIssues?.filter(
    (w) => w.status === "wrong" || w.status === "missed"
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && characterName && (
          <span className="text-xs text-gray-500 ml-1">{characterName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          {content}
          {isStreaming && (
            <span className="ml-1 animate-pulse">▊</span>
          )}
        </div>

        {/* Pronunciation feedback for user turns */}
        {isUser && detectedSpeech && wrongWords && wrongWords.length > 0 && (
          <div className="mt-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs">
            <p className="font-medium text-red-700 mb-1">
              Pronunciation issues:
            </p>
            <div className="flex flex-wrap gap-1">
              {wrongWords.map((w, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white border border-red-200 px-2 py-0.5 text-red-600"
                  title={
                    w.transcribedWord
                      ? `You said: "${w.transcribedWord}"`
                      : "Word was missed"
                  }
                >
                  {w.word}
                  {w.status === "missed" && (
                    <span className="ml-1 text-gray-400">(missed)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
        {isUser && detectedSpeech && (!wrongWords || wrongWords.length === 0) && (
          <span className="text-xs text-green-600 mr-1">✓ Great pronunciation!</span>
        )}
      </div>
    </div>
  );
}
