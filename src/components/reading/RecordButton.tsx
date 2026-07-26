"use client";

import { Button } from "@/components/ui/Button";

interface RecordButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({
  isRecording,
  isSupported,
  onStart,
  onStop,
  disabled,
}: RecordButtonProps) {
  if (!isSupported) {
    return (
      <Button disabled variant="secondary" size="lg">
        🎤 Microphone Not Available
      </Button>
    );
  }

  if (isRecording) {
    return (
      <Button
        variant="danger"
        size="lg"
        onClick={onStop}
        className="animate-pulse"
      >
        ⏹ Stop Recording
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onStart}
      disabled={disabled}
    >
      🎤 Start Recording
    </Button>
  );
}
