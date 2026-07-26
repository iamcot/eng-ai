"use client";

import { Button } from "@/components/ui/Button";

interface MicButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  isDisabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({
  isRecording,
  isSupported,
  isDisabled,
  onStart,
  onStop,
}: MicButtonProps) {
  if (!isSupported) {
    return (
      <button
        disabled
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed text-2xl"
        title="Microphone not supported in this browser"
      >
        🎤
      </button>
    );
  }

  if (isRecording) {
    return (
      <button
        onClick={onStop}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white text-2xl shadow-lg transition-transform hover:scale-105 animate-pulse"
        title="Stop recording"
      >
        ⏹
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={isDisabled}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white text-2xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      title="Start recording your response"
    >
      🎤
    </button>
  );
}
