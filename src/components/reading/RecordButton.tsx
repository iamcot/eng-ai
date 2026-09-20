"use client";

import { Button } from "@/components/ui/Button";

interface RecordButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, isSupported, onStart, onStop, disabled }: RecordButtonProps) {
  if (!isSupported) {
    return <Button disabled variant="secondary" size="sm">🎤 Không có microphone</Button>;
  }
  if (isRecording) {
    return <Button variant="danger" size="sm" onClick={onStop} className="animate-pulse">⏹ Dừng</Button>;
  }
  return (
    <Button variant="primary" size="sm" onClick={onStart} disabled={disabled}>
      🎤 Thu âm
    </Button>
  );
}
