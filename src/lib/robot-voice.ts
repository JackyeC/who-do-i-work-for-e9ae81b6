/** Robot voice presets for the AI Interviewer */

export type VoicePreset = "standard" | "fast" | "strict";

export const VOICE_PRESETS: Record<VoicePreset, { label: string; rate: number; pitch: number }> = {
  standard: { label: "Standard Robot", rate: 0.92, pitch: 0.72 },
  fast:     { label: "Fast Robot",     rate: 1.08, pitch: 0.68 },
  strict:   { label: "Strict Robot",   rate: 0.84, pitch: 0.60 },
};

/** Pick the best English voice with robotic priority */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const en = voices.filter((v) => v.lang.startsWith("en"));

  const google = en.find((v) => v.name.includes("Google US English"));
  if (google) return google;

  const ms = en.find((v) => v.name.includes("Microsoft"));
  if (ms) return ms;

  return en[0] || voices[0] || null;
}

/** Break text into short mechanical chunks */
function chunkText(text: string): string[] {
  return text
    .replace(/([.!?])\s*/g, "$1|")
    .replace(/,\s*/g, ",|")
    .replace(/—/g, "—|")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Speak text in a deliberately robotic manner */
export function speakRobot(text: string, preset: VoicePreset = "standard"): void {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const config = VOICE_PRESETS[preset];
  const chunks = chunkText(text);

  // Voices may load async — try immediately, retry once after onvoiceschanged
  const trySpeak = () => {
    const voice = pickVoice();
    chunks.forEach((chunk, i) => {
      const utt = new SpeechSynthesisUtterance(chunk);
      if (voice) utt.voice = voice;
      utt.rate = config.rate;
      utt.pitch = config.pitch;
      utt.volume = 1;
      speechSynthesis.speak(utt);
    });
  };

  if (speechSynthesis.getVoices().length > 0) {
    trySpeak();
  } else {
    speechSynthesis.onvoiceschanged = () => {
      trySpeak();
      speechSynthesis.onvoiceschanged = null;
    };
  }
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
