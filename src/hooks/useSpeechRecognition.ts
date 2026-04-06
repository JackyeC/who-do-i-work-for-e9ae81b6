import { useState, useRef, useCallback, useEffect } from "react";

export type MicStatus = "idle" | "listening" | "processing" | "ready" | "error";

interface SpeechRecognitionHook {
  supported: boolean;
  micStatus: MicStatus;
  isListening: boolean;
  interimText: string;
  finalText: string;
  errorMessage: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const log = (...args: any[]) => console.log("[MockInterview Voice]", ...args);

if (typeof window !== "undefined") {
  log("Speech recognition supported:", !!SpeechRecognitionAPI);
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const supported = !!SpeechRecognitionAPI;
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");
  const stoppedManuallyRef = useRef(false);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setErrorMessage("Voice practice works best in Chrome.");
      setMicStatus("error");
      log("start failed: unsupported");
      return;
    }

    cleanup();
    stoppedManuallyRef.current = false;
    setErrorMessage("");
    setInterimText("");
    setMicStatus("processing");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      log("start");
      setMicStatus("listening");
    };

    recognition.onspeechend = () => {
      log("speechend");
      setMicStatus("processing");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const chunk = result[0].transcript;
          log("final chunk:", chunk);
          final += chunk + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        accumulatedRef.current += final;
        setFinalText(accumulatedRef.current.trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      const code = event.error;
      log("error:", code);
      if (code === "not-allowed" || code === "permission-denied") {
        setErrorMessage("Microphone access denied. Switching to text mode.");
      } else if (code === "no-speech") {
        setErrorMessage("No speech detected. Try again.");
      } else {
        setErrorMessage(`Speech error: ${code}`);
      }
      setMicStatus("error");
      cleanup();
    };

    recognition.onend = () => {
      log("end, stoppedManually:", stoppedManuallyRef.current);
      if (!stoppedManuallyRef.current && recognitionRef.current === recognition) {
        setMicStatus("ready");
      }
    };

    try {
      recognition.start();
    } catch (err: any) {
      log("start exception:", err);
      setErrorMessage("Could not start microphone.");
      setMicStatus("error");
    }
  }, [cleanup]);

  const stopListening = useCallback(() => {
    log("stop");
    stoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setMicStatus("ready");
    setInterimText("");
  }, []);

  const resetTranscript = useCallback(() => {
    log("reset");
    stoppedManuallyRef.current = true;
    cleanup();
    accumulatedRef.current = "";
    setFinalText("");
    setInterimText("");
    setMicStatus("idle");
    setErrorMessage("");
  }, [cleanup]);

  return {
    supported,
    micStatus,
    isListening: micStatus === "listening",
    interimText,
    finalText,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
