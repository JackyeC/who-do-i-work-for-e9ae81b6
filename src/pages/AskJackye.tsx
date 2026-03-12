import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Should I take this offer?",
  "How do I negotiate salary?",
  "What questions should I ask HR?",
  "Is this company safe to work for?",
  "What does this connection chain mean for me?",
  "Help me write a counter-offer",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

export default function AskJackyePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
                if (last?.role === "assistant") {
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
    <div className="flex flex-col h-[calc(100vh-78px)]">
      {/* Coach header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-surface-2 border-b border-border shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-xl font-bold text-primary-foreground shrink-0">
          JC
        </div>
        <div className="flex-1">
          <div className="font-serif text-base font-bold text-primary">Jackye Clayton</div>
          <div className="text-[11px] text-muted-foreground">Career Strategist · HR Intelligence Expert · Your Advocate</div>
        </div>
        <div className="font-mono text-[9px] tracking-wider uppercase px-2.5 py-1 border border-primary/40 text-primary">
          AI Coach
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-border">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-[10px] px-3 py-2 border border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && (
          <div className="p-8 max-w-2xl mx-auto text-center">
            <div className="font-serif text-xl text-primary mb-3">Welcome to Ask Jackye.</div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              I'm Jackye Clayton — career strategist with 20+ years in HR. I've seen every kind of offer, every type of employer, and every career mistake that could have been avoided with better information.
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ask me about any company, any offer letter, any career decision. I'll give you the truth — not the corporate-approved version.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`px-6 py-4 border-b border-border text-[13px] leading-relaxed ${
              msg.role === "assistant"
                ? "bg-primary/[0.04] border-l-2 border-l-primary"
                : "bg-surface-2 border-l-2 border-l-border"
            }`}
          >
            <div className="font-mono text-micro tracking-wider uppercase mb-2">
              {msg.role === "assistant" ? (
                <span className="text-primary">Jackye Clayton</span>
              ) : (
                <span className="text-muted-foreground">You</span>
              )}
            </div>
            <div className={`max-w-3xl ${msg.role === "assistant" ? "text-foreground" : "text-muted-foreground"}`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:leading-relaxed [&_strong]:text-primary [&_li]:text-foreground [&_h3]:font-serif [&_h3]:text-primary [&_h3]:text-base"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="px-6 py-4 border-b border-border bg-primary/[0.04] border-l-2 border-l-primary">
            <div className="font-mono text-micro tracking-wider uppercase text-primary mb-2">Jackye Clayton</div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex border-t border-border shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask Jackye anything about this company, this offer, or your career..."
          className="flex-1 bg-surface-2 border-none outline-none px-6 py-4 text-foreground font-sans text-[13px] placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <button
          onClick={() => send(input)}
          disabled={isLoading || !input.trim()}
          className="bg-primary text-primary-foreground px-6 font-mono text-[10px] tracking-wider uppercase font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
