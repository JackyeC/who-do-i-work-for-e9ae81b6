import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Send, Loader2, StopCircle, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { RoundFeedback, type FeedbackData } from "./RoundFeedback";
import type { SimulatorConfig } from "./SimulatorSetup";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  config: SimulatorConfig;
  messages: Msg[];
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  feedbacks: FeedbackData[];
  setFeedbacks: React.Dispatch<React.SetStateAction<FeedbackData[]>>;
  onEndSession: () => void;
}

const MAX_ROUNDS = 5;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/negotiation-simulator`;

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function SimulatorChat({ config, messages, setMessages, feedbacks, setFeedbacks, onEndSession }: Props) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userRounds = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start: send initial system context
  useEffect(() => {
    if (messages.length === 0) {
      streamMessage([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-end when round limit reached
  useEffect(() => {
    if (userRounds >= MAX_ROUNDS && !isStreaming) {
      onEndSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRounds, isStreaming]);

  const toggleMic = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  async function streamMessage(history: Msg[]) {
    setIsStreaming(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history, config }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Simulator error:", resp.status, errText);
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls?.[0]?.function?.arguments) continue;
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Extract feedback
      try {
        const feedbackMatch = assistantSoFar.match(/\[FEEDBACK\]([\s\S]*?)\[\/FEEDBACK\]/);
        if (feedbackMatch) {
          const fb = JSON.parse(feedbackMatch[1]) as FeedbackData;
          setFeedbacks((prev) => [...prev, fb]);
          const cleanContent = assistantSoFar.replace(/\[FEEDBACK\][\s\S]*?\[\/FEEDBACK\]/, "").trim();
          if (cleanContent) {
            setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanContent } : m));
          }
        }
      } catch { /* best-effort */ }
    } catch (e) {
      console.error("Stream error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection interrupted. Please try again." }]);
    }

    setIsStreaming(false);
  }

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming || userRounds >= MAX_ROUNDS) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages((prev) => [...prev, userMsg]);
    await streamMessage(newHistory);
  };

  const roundProgress = (userRounds / MAX_ROUNDS) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Round indicator */}
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Round {Math.min(userRounds + 1, MAX_ROUNDS)} of {MAX_ROUNDS}
        </p>
        <Progress value={roundProgress} className="h-1.5 flex-1" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-3 min-h-[300px] max-h-[500px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-foreground border border-border/30"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}

        {feedbacks.map((fb, i) => (
          <RoundFeedback key={i} feedback={fb} round={i + 1} />
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted/50 rounded-xl px-4 py-2.5 border border-border/30">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/30 pt-3 space-y-2">
        {userRounds >= MAX_ROUNDS ? (
          <p className="text-xs text-muted-foreground text-center py-2">Session complete — {MAX_ROUNDS} rounds reached.</p>
        ) : (
          <div className="flex gap-2">
            {SpeechRecognitionAPI && (
              <Button
                size="icon"
                variant={isListening ? "default" : "outline"}
                onClick={toggleMic}
                disabled={isStreaming}
                className={`h-10 w-10 shrink-0 ${isListening ? "animate-pulse" : ""}`}
                title={isListening ? "Stop listening" : "Speak your response"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening…" : "Type your response to the recruiter…"}
              className="h-10 text-sm"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              disabled={isStreaming}
            />
            <Button size="icon" onClick={send} disabled={isStreaming || !input.trim()} className="h-10 w-10 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onEndSession} className="text-xs text-muted-foreground gap-1">
            <StopCircle className="w-3 h-3" /> End Session
          </Button>
        </div>
      </div>
    </div>
  );
}
