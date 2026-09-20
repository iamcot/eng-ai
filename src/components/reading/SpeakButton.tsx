"use client";

interface SpeakButtonProps {
  text: string;
  disabled?: boolean;
}

export function SpeakButton({ text, disabled }: SpeakButtonProps) {
  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  return (
    <button
      onClick={speak}
      disabled={disabled}
      title="Nghe đoạn văn"
      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      🔊 <span>Nghe</span>
    </button>
  );
}
