import { useState, useRef, useEffect } from "react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const MarkdownWrapper = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:leading-relaxed [&_strong]:text-primary [&_li]:text-foreground">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Should I apply?",
  "Take this offer?",
  "Stay or leave?",
  "Interview questions",
  "Explain my move",
  "What to negotiate",
];

const OPENING_MESSAGE: Msg = {
  role: "assistant",
  content: "Hey — I'm Jackye. Tell me what you're weighing, and I'll give you the real talk. Receipts included.",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

export function AskJackyeWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages.filter(m => m !== OPENING_MESSAGE), userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages(prev => [...prev, { role: "assistant", content: "Your session expired. Please sign in again." }]);
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        setMessages(prev => [...prev, { role: "assistant", content: errData.error || "Something went wrong. Try again." }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last !== OPENING_MESSAGE) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
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
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Try again." }]);
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all group"
          title="Ask Jackye"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border shrink-0">
            <img src={jackyeHeadshot} alt="Jackye Clayton" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground">Jackye Clayton</div>
              <div className="text-xs text-muted-foreground">Your career advocate</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Logged-out gate */}
          {!user && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">Ask Jackye</p>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-[280px]">
                Get career advice, offer analysis, and negotiation strategy — from someone who's spent 15+ years inside hiring.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-xs font-semibold hover:brightness-110 transition-all"
              >
                Sign in to start
              </button>
            </div>
          )}

          {/* Quick prompts (logged in, no messages yet beyond opening) */}
          {user && messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Messages (logged in only) */}
          {user && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 border-b border-border/30 text-[13px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-primary/[0.04] border-l-2 border-l-primary/50"
                      : "bg-muted/20 border-l-2 border-l-border"
                  }`}
                >
                  <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5">
                    {msg.role === "assistant" ? (
                      <span className="text-primary">Jackye</span>
                    ) : (
                      <span className="text-muted-foreground">You</span>
                    )}
                  </div>
                  <div className={msg.role === "assistant" ? "text-foreground" : "text-muted-foreground"}>
                    {msg.role === "assistant" ? (
                      <MarkdownWrapper content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="px-4 py-3 border-b border-border/30 bg-primary/[0.04] border-l-2 border-l-primary/50">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-primary mb-1.5">Jackye</div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-100" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input (logged in only) */}
          {user && (
            <div className="flex border-t border-border shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask Jackye anything..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-foreground text-[13px] placeholder:text-muted-foreground/50"
                disabled={isLoading}
              />
              <button
                onClick={() => send(input)}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground px-4 hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
