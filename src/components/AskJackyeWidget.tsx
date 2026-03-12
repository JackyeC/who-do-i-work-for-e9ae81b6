import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MarkdownWrapper = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:leading-relaxed [&_strong]:text-primary [&_li]:text-foreground">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Should I take this offer?",
  "How do I negotiate salary?",
  "What questions should I ask HR?",
  "Is this company safe to work for?",
  "Help me write a counter-offer",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

export function AskJackyeWidget() {
  const [open, setOpen] = useState(false);
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
        setMessages(prev => [...prev, { role: "assistant", content: errData.error || "Something went wrong. Try again in a moment." }]);
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
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground w-14 h-14 flex items-center justify-center shadow-lg hover:brightness-110 transition-all group"
          title="Ask Jackye"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-card border border-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border-b border-border shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-base font-bold text-primary-foreground shrink-0">
              JC
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-serif text-sm font-bold text-primary">Jackye Clayton</div>
              <div className="text-[11px] text-muted-foreground">Career Strategist · Your Advocate</div>
            </div>
            <div className="font-mono text-micro tracking-wider uppercase px-2 py-0.5 border border-primary/40 text-primary">
              AI Coach
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick prompts */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[10px] px-2.5 py-1.5 border border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {messages.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-[12px]">
                <p className="font-serif text-sm text-primary mb-2">Welcome.</p>
                <p>I'm Jackye Clayton — career strategist with 20+ years in HR. Ask me about any company, any offer, or any career decision. I'll tell you what most people won't say out loud.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-4 py-3 border-b border-border text-[12px] leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-primary/[0.04] border-l-2 border-l-primary"
                    : "bg-surface-2 border-l-2 border-l-border"
                }`}
              >
                <div className="font-mono text-micro tracking-wider uppercase mb-1.5">
                  {msg.role === "assistant" ? (
                    <span className="text-primary">Jackye Clayton</span>
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
              <div className="px-4 py-3 border-b border-border bg-primary/[0.04] border-l-2 border-l-primary">
                <div className="font-mono text-micro tracking-wider uppercase text-primary mb-1.5">Jackye Clayton</div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-200" />
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
              placeholder="Ask Jackye anything..."
              className="flex-1 bg-surface-2 border-none outline-none px-4 py-3 text-foreground font-sans text-[12px] placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              onClick={() => send(input)}
              disabled={isLoading || !input.trim()}
              className="bg-primary text-primary-foreground px-4 font-mono text-[10px] tracking-wider uppercase font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
