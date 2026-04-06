export type VoicePreset = "standard" | "fast" | "strict";

export const VOICE_PRESETS: Record<VoicePreset, { label: string; rate: number; pitch: number; volume: number }> = {
  standard: { label: "Standard Robot", rate: 0.92, pitch: 0.72, volume: 1 },
  fast:     { label: "Fast Robot",     rate: 1.08, pitch: 0.68, volume: 1 },
  strict:   { label: "Strict Robot",   rate: 0.84, pitch: 0.60, volume: 1 },
};

function chooseVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const en = voices.filter((v) => v.lang.startsWith("en"));

  const google = en.find((v) => v.name.includes("Google"));
  if (google) return google;

  const ms = en.find((v) => v.name.includes("Microsoft"));
  if (ms) return ms;

  return en[0] || voices[0] || null;
}

function chunkText(text: string, target = 200): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= target + 20) {
      chunks.push(remaining);
      break;
    }

    let cutAt = -1;
    const searchEnd = Math.min(remaining.length, target + 20);

    // Prefer sentence boundaries within target range
    for (let i = searchEnd; i >= target - 20 && i >= 0; i--) {
      if (".!?".includes(remaining[i])) {
        cutAt = i + 1;
        break;
      }
    }

    // Fall back to punctuation
    if (cutAt < 0) {
      for (let i = searchEnd; i >= target - 20 && i >= 0; i--) {
        if (",;:—".includes(remaining[i])) {
          cutAt = i + 1;
          break;
        }
      }
    }

    // Fall back to space
    if (cutAt < 0) {
      for (let i = searchEnd; i >= 0; i--) {
        if (remaining[i] === " ") {
          cutAt = i + 1;
          break;
        }
      }
    }

    if (cutAt <= 0) cutAt = searchEnd;

    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  return chunks.filter(Boolean);
}

export function speakRobot(text: string, preset: VoicePreset = "strict"): void {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const config = VOICE_PRESETS[preset];
  const chunks = chunkText(text);

  const trySpeak = () => {
    const voice = chooseVoice();
    chunks.forEach((chunk) => {
      const utt = new SpeechSynthesisUtterance(chunk);
      if (voice) utt.voice = voice;
      utt.rate = config.rate;
      utt.pitch = config.pitch;
      utt.volume = config.volume;
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
