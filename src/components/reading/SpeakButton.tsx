"use client";

import { useState } from "react";
import { speakText } from "@/lib/azureTts";

interface SpeakButtonProps {
  text: string;
  disabled?: boolean;
}

export function SpeakButton({ text, disabled }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  async function toggle() {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      await speakText(text);
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={speaking ? "Dừng" : "Nghe đoạn văn"}
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        speaking
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      {speaking ? "⏹ Dừng" : "🔊 Nghe"}
    </button>
  );
}
