"use client";

import { useEffect } from "react";

export function BrowserSupportCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {}, []); // ensure client-side only

  if (typeof window === "undefined") return <>{children}</>;

  const isSupported =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
        <p className="font-semibold">⚠️ Browser Not Supported</p>
        <p className="mt-1 text-sm">
          Speech recognition requires <strong>Google Chrome</strong> or{" "}
          <strong>Microsoft Edge</strong>. Firefox and Safari do not support the
          Web Speech API.
        </p>
        <p className="mt-1 text-sm">
          Please open this app in Chrome or Edge to use recording features.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
