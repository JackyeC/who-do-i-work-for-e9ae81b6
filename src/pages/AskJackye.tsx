import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SignupGate } from "@/components/SignupGate";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

interface QuickPrompt {
  label: string;
  prompt: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Should I apply?", prompt: "Should I apply to this company? What should I look at before deciding?" },
  { label: "Take this offer?", prompt: "I got a job offer. How do I evaluate whether I should take it?" },
  { label: "Stay or leave?", prompt: "I'm thinking about leaving my current job. How do I decide if it's time to go?" },
  { label: "Interview questions", prompt: "What should I ask in my interview to find out what this company is really like?" },
  { label: "Explain my move", prompt: "How do I explain my next career move without it sounding like I'm running away?" },
  { label: "What to negotiate", prompt: "What should I negotiate beyond salary? What do most people miss?" },
];

const OPENING_MESSAGE: Msg = {
  role: "assistant",
  content: `Hey — I'm Jackye. I've spent 15+ years inside hiring. Tell me what you're weighing, and I'll give you the real talk — receipts included.`,
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

export default function AskJackyePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  usePageSEO({
    title: "Ask Jackye — Your Career Advocate",
    description: "Get direct, strategic career advice from Jackye Clayton. Should you apply? Take the offer? What to negotiate? Receipts included.",
    path: "/ask-jackye",
    jsonLd: {
      "@type": "WebApplication",
      name: "Ask Jackye — Career Advocate",
      description: "AI-powered career advocacy built on 15+ years of recruiting expertise.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      featureList: "Career advice, offer analysis, interview prep, negotiation strategy",
    },
  });

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
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const apiMessages = [...messages.filter((m) => m !== OPENING_MESSAGE), userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Your session expired. Please sign in again to continue." },
        ]);
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        const errorContent =
          resp.status === 429
            ? "I'm at capacity right now. Try again in a moment."
            : resp.status === 402
            ? "AI credits are exhausted. Please add credits to continue."
            : errData.error || "Something went wrong. Try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: errorContent }]);
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
              setMessages((prev) => {
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

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last !== OPENING_MESSAGE) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection lost. Try again." },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-78px)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="relative">
            <img
              src={jackyeHeadshot}
              alt="Jackye Clayton"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-civic-green rounded-full border-2 border-card" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Ask Jackye</h1>
            <p className="text-xs text-muted-foreground">Your career advocate · 15+ years inside hiring</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Powered by WDIWF Intelligence</span>
          </div>
        </div>
      </div>

      {/* Quick Prompts — shown at start */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 border-b border-border bg-card/50 shrink-0">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            What's on your mind?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                className="group flex items-center gap-2 p-3 border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left rounded-lg"
              >
                <span className="text-xs text-foreground group-hover:text-primary transition-colors font-medium">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "px-6 py-5 border-b border-border/30 text-sm leading-relaxed",
              msg.role === "assistant"
                ? "bg-primary/[0.03] border-l-2 border-l-primary/50"
                : "bg-card/60 border-l-2 border-l-muted-foreground/20"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {msg.role === "assistant" ? (
                <>
                  <img src={jackyeHeadshot} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs font-semibold text-primary">Jackye</span>
                </>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">You</span>
              )}
            </div>
            <div className="max-w-3xl pl-7">
              {msg.role === "assistant" ? (
                <div className={cn(
                  "prose prose-sm max-w-none text-foreground",
                  "[&_p]:mb-3 [&_p]:leading-relaxed",
                  "[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2",
                  "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2",
                  "[&_strong]:text-primary [&_strong]:font-semibold",
                  "[&_li]:text-foreground [&_li]:mb-1",
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                  "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
                  "[&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs",
                  "[&_table]:w-full [&_table]:text-xs [&_table]:my-4",
                  "[&_th]:text-xs [&_th]:text-muted-foreground [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:border-b [&_th]:border-border",
                  "[&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-border/30",
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-foreground">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="px-6 py-5 border-b border-border/30 bg-primary/[0.03] border-l-2 border-l-primary/50">
            <div className="flex items-center gap-2 mb-2">
              <img src={jackyeHeadshot} alt="" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs font-semibold text-primary">Jackye</span>
            </div>
            <div className="pl-7 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Looking at the receipts...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Signup gate for unauthenticated users */}
      {!user && !loading && (
        <SignupGate feature="Ask Jackye" blurPreview={false} />
      )}

      {/* Input */}
      <div className="border-t border-border shrink-0 bg-card">
        <div className="flex items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask about a company, an offer, or your next move..."
            className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-foreground text-sm placeholder:text-muted-foreground/50"
            disabled={isLoading}
          />
          <button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            className="px-5 py-4 text-primary hover:bg-primary/10 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
