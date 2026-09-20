"use client";

export async function speakIpa(rawSymbol: string): Promise<void> {
  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  if (!key || !region) {
    console.warn("[Azure TTS] not configured");
    return;
  }

  // "/ɪ/" → "ɪ",  "/tʃ/" → "tʃ"
  const phoneme = rawSymbol.replace(/\//g, "");

  const SDK = await import("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
  const audioConfig = SDK.AudioConfig.fromDefaultSpeakerOutput();
  const synthesizer = new SDK.SpeechSynthesizer(speechConfig, audioConfig);

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
