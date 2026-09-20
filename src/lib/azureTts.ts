"use client";

async function getSynthesizer() {
  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;
  if (!key || !region) return null;
  const SDK = await import("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
  const audioConfig = SDK.AudioConfig.fromDefaultSpeakerOutput();
  return { SDK, synthesizer: new SDK.SpeechSynthesizer(speechConfig, audioConfig) };
}

export async function speakText(text: string, voice = "en-US-JennyNeural", rate = "0.9"): Promise<void> {
  const ctx = await getSynthesizer();
  if (!ctx) {
    // Fallback to browser TTS
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = parseFloat(rate);
    window.speechSynthesis.speak(u);
    return;
  }
  const { synthesizer } = ctx;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${voice}"><prosody rate="${rate}">${text}</prosody></voice>
</speak>`;
  return new Promise((resolve) => {
    synthesizer.speakSsmlAsync(
      ssml,
      () => { synthesizer.close(); resolve(); },
      (err) => { console.error("[Azure TTS] error:", err); synthesizer.close(); resolve(); }
    );
  });
}

export async function speakIpa(rawSymbol: string): Promise<void> {
  const ctx = await getSynthesizer();
  if (!ctx) return;
  const { synthesizer } = ctx;
  const phoneme = rawSymbol.replace(/\//g, "");
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
  <voice name="en-GB-SoniaNeural">
    <phoneme alphabet="ipa" ph="${phoneme}"></phoneme>
  </voice>
</speak>`;
  return new Promise((resolve) => {
    synthesizer.speakSsmlAsync(
      ssml,
      () => { synthesizer.close(); resolve(); },
      (err) => { console.error("[Azure TTS] error:", err); synthesizer.close(); resolve(); }
    );
  });
}
