import { useState, useRef, useCallback, useEffect } from "react";

export type MicStatus = "idle" | "listening" | "processing" | "ready" | "error";

interface SpeechRecognitionHook {
  supported: boolean;
  micStatus: MicStatus;
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

export function useSpeechRecognition(): SpeechRecognitionHook {
  const supported = !!SpeechRecognitionAPI;
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
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
      return;
    }

    cleanup();
    setErrorMessage("");
    setInterimText("");
    setMicStatus("processing");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setMicStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
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
      if (micStatus !== "error" && recognitionRef.current === recognition) {
        setMicStatus("ready");
      }
    };

    try {
      recognition.start();
    } catch (err: any) {
      setErrorMessage("Could not start microphone.");
      setMicStatus("error");
    }
  }, [cleanup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setMicStatus("ready");
    setInterimText("");
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedRef.current = "";
    setFinalText("");
    setInterimText("");
    setMicStatus("idle");
    setErrorMessage("");
  }, []);

  return {
    supported,
    micStatus,
    interimText,
    finalText,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
