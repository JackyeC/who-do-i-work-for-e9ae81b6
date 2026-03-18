import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, StopCircle } from "lucide-react";
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/negotiation-simulator`;

export function SimulatorChat({ config, messages, setMessages, feedbacks, setFeedbacks, onEndSession }: Props) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const round = Math.ceil(messages.filter((m) => m.role === "user").length);

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
            // Check for tool calls (feedback)
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls?.[0]?.function?.arguments) {
              // Accumulate tool call args — will parse at end
              continue;
            }
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

      // Try to extract feedback from the response
      try {
        const feedbackMatch = assistantSoFar.match(/\[FEEDBACK\]([\s\S]*?)\[\/FEEDBACK\]/);
        if (feedbackMatch) {
          const fb = JSON.parse(feedbackMatch[1]) as FeedbackData;
          setFeedbacks((prev) => [...prev, fb]);
          // Clean the feedback tag from displayed message
          const cleanContent = assistantSoFar.replace(/\[FEEDBACK\][\s\S]*?\[\/FEEDBACK\]/, "").trim();
          if (cleanContent) {
            setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanContent } : m));
          }
        }
      } catch { /* feedback parsing is best-effort */ }

    } catch (e) {
      console.error("Stream error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection interrupted. Please try again." }]);
    }

    setIsStreaming(false);
  }

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages((prev) => [...prev, userMsg]);
    await streamMessage(newHistory);
  };

  return (
    <div className="flex flex-col h-full">
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

        {/* Show feedback after assistant rounds */}
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response to the recruiter…"
            className="h-10 text-sm"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            disabled={isStreaming}
          />
          <Button size="icon" onClick={send} disabled={isStreaming || !input.trim()} className="h-10 w-10 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onEndSession} className="text-xs text-muted-foreground gap-1">
            <StopCircle className="w-3 h-3" /> End Session
          </Button>
        </div>
      </div>
    </div>
  );
}
