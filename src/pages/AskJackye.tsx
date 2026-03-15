import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal, Send, Sparkles, Shield, Users, DollarSign,
  TrendingUp, AlertTriangle, ChevronDown, ChevronRight,
  Loader2, Scan, Database, FileSearch, BarChart3,
} from "lucide-react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import ReactMarkdown from "react-markdown";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

interface IntelPrompt {
  icon: typeof Shield;
  label: string;
  category: string;
  prompt: string;
  color: string;
}

const INTELLIGENCE_PROMPTS: IntelPrompt[] = [
  {
    icon: Shield,
    label: "Company Health",
    category: "HEALTH",
    prompt: "Analyze this company's recent headcount volatility and WARN signals.",
    color: "text-civic-green",
  },
  {
    icon: Users,
    label: "Leadership Vibe",
    category: "LEADERSHIP",
    prompt: "What is the demographic and tenure profile of the executive team?",
    color: "text-civic-blue",
  },
  {
    icon: DollarSign,
    label: "Offer Analysis",
    category: "COMPENSATION",
    prompt: "Is this salary and equity package competitive for my market?",
    color: "text-civic-yellow",
  },
  {
    icon: TrendingUp,
    label: "Culture Check",
    category: "CULTURE",
    prompt: "Do employees in this company get promoted, or is there a 'revolving door' signal?",
    color: "text-primary",
  },
  {
    icon: AlertTriangle,
    label: "Risk Assessment",
    category: "RISK",
    prompt: "What are the primary workforce risks for candidates in 2026?",
    color: "text-destructive",
  },
];

const SCAN_PHASES = [
  { label: "Scanning SEC Filings...", icon: FileSearch, duration: 600 },
  { label: "Analyzing Workforce Volatility...", icon: BarChart3, duration: 800 },
  { label: "Cross-referencing Leadership Data...", icon: Database, duration: 700 },
  { label: "Calculating Intelligence Score...", icon: Scan, duration: 500 },
];

const OPENING_MESSAGE: Msg = {
  role: "assistant",
  content: "**INTELLIGENCE ADVISOR ONLINE**\n\nI've reviewed the intelligence dossier. Before you make any decisions, here's what you need to understand: the connection chain tells you who this company *really* is — not just who they say they are on their careers page.\n\nI cross-reference SEC filings, EEO-1 data, labor market benchmarks, and workforce signals to give you an objective intelligence briefing.\n\nSelect an intelligence category below, or ask me anything.\n\n*Run the chain first. Always.*",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the "Your Intelligence Advisor" system?',
    answer: "The Intelligence Advisor is a specialized AI engine built on the People Puzzles proprietary talent framework. Unlike generic chatbots, this system is designed to think like a veteran Head of Talent. It doesn't just 'chat' — it cross-references SEC filings, EEO-1 data, labor market benchmarks, and social signals to provide an objective intelligence briefing.",
  },
  {
    question: 'Who is the "AI Twin" powering this logic?',
    answer: "The 'brain' of this advisor is the digital twin of our founder, Jackye Clayton. With over 15 years of experience leading Talent Acquisition for global tech firms (including her tenure as VP of TA at Textio) and her deep roots in the Waco community, Jackye has developed a unique methodology for 'reading between the lines' of company data.",
  },
  {
    question: "How does Jackye's experience influence the AI?",
    answer: "We have codified Jackye's professional logic — her 'talent intuition' — into the system's core algorithms. This includes: Signal Weighting (knowing which data points actually predict a healthy 'inclusive vibe'), Normalization (standardizing messy corporate reporting into clear insights), and Risk Detection (spotting 'red flag' patterns that standard algorithms miss).",
  },
];

export default function AskJackyePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanPhase, setScanPhase] = useState(-1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  usePageSEO({
    title: "Intelligence Advisor — AI Career Strategy",
    description: "Analyze companies, leadership, and market signals with an AI-powered intelligence assistant. Powered by Jackye Clayton's talent framework.",
    path: "/ask-jackye",
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runScanAnimation = useCallback(async () => {
    for (let i = 0; i < SCAN_PHASES.length; i++) {
      setScanPhase(i);
      await new Promise((r) => setTimeout(r, SCAN_PHASES[i].duration));
    }
    setScanPhase(-1);
  }, []);

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

    // Start scan animation
    runScanAnimation();

    let assistantSoFar = "";
    const apiMessages = [...messages.filter((m) => m !== OPENING_MESSAGE), userMsg];

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "**SESSION EXPIRED** — Please sign in again to access the Intelligence Advisor." },
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
            ? "**RATE LIMITED** — Intelligence systems at capacity. Try again in a moment."
            : resp.status === 402
            ? "**CREDITS EXHAUSTED** — Add credits to continue using the Intelligence Advisor."
            : errData.error || "**SYSTEM ERROR** — Intelligence scan failed. Try again.";
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
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
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "**CONNECTION LOST** — Unable to reach intelligence systems. Try again." }]);
    }

    setIsLoading(false);
  };

  const currentScan = scanPhase >= 0 ? SCAN_PHASES[scanPhase] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-78px)] bg-background">
      {/* Terminal Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={jackyeHeadshot}
                alt="Jackye Clayton"
                className="w-10 h-10 object-cover border border-border"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-civic-green rounded-full border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-civic-green" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">
                  Intelligence Advisor
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Jackye Clayton · AI Twin · People Puzzles Framework
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-civic-green/60" />
              <div className="w-2 h-2 rounded-full bg-civic-green/30" />
            </div>
            <span className="font-mono text-[9px] text-civic-green/80 tracking-widest uppercase">
              Online
            </span>
          </div>
        </div>

        {/* Scan progress bar */}
        {currentScan && (
          <div className="px-6 py-2 border-t border-border/50 bg-civic-green/5">
            <div className="flex items-center gap-2">
              <currentScan.icon className="w-3.5 h-3.5 text-civic-green animate-pulse" />
              <span className="font-mono text-[10px] text-civic-green tracking-wider">
                {currentScan.label}
              </span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-civic-green rounded-full transition-all duration-500"
                  style={{
                    width: `${((scanPhase + 1) / SCAN_PHASES.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Intelligence Prompts — shown at start */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 border-b border-border bg-card/50 shrink-0">
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-3">
            Select Intelligence Category
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {INTELLIGENCE_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                className="group flex items-start gap-2.5 p-3 border border-border bg-background hover:border-civic-green/40 hover:bg-civic-green/5 transition-all text-left"
              >
                <p.icon className={cn("w-4 h-4 mt-0.5 shrink-0", p.color)} />
                <div>
                  <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground group-hover:text-civic-green transition-colors">
                    {p.category}
                  </span>
                  <p className="text-[11px] text-foreground mt-0.5 leading-snug">
                    {p.label}
                  </p>
                </div>
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
              "px-6 py-4 border-b border-border/50 text-[13px] leading-relaxed",
              msg.role === "assistant"
                ? "bg-civic-green/[0.03] border-l-2 border-l-civic-green"
                : "bg-card border-l-2 border-l-muted-foreground/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {msg.role === "assistant" ? (
                <>
                  <Terminal className="w-3 h-3 text-civic-green" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-civic-green font-bold">
                    Intelligence Advisor
                  </span>
                  <span className="font-mono text-[9px] text-civic-green/50">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                    You
                  </span>
                </>
              )}
            </div>
            <div className="max-w-3xl pl-5">
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-2 [&_p]:leading-relaxed [&_strong]:text-civic-green [&_li]:text-foreground [&_h1]:font-mono [&_h1]:text-civic-green [&_h1]:text-sm [&_h1]:tracking-wider [&_h1]:uppercase [&_h2]:font-mono [&_h2]:text-civic-green [&_h2]:text-xs [&_h2]:tracking-wider [&_h2]:uppercase [&_h3]:font-mono [&_h3]:text-civic-green [&_h3]:text-xs [&_h3]:tracking-wider [&_em]:text-civic-green/80 [&_code]:text-civic-green [&_code]:bg-civic-green/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_a]:text-civic-blue [&_hr]:border-border">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-muted-foreground">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="px-6 py-4 border-b border-border/50 bg-civic-green/[0.03] border-l-2 border-l-civic-green">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3 h-3 text-civic-green" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-civic-green font-bold">
                Intelligence Advisor
              </span>
            </div>
            <div className="pl-5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-civic-green animate-spin" />
              <span className="font-mono text-[10px] text-civic-green/70 tracking-wider">
                Processing intelligence query...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* FAQ Section — shown at start */}
      {messages.length <= 1 && (
        <div className="border-t border-border bg-card/50 shrink-0 max-h-[200px] overflow-y-auto">
          <div className="px-6 py-3">
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-2">
              About the Intelligence Advisor
            </p>
            <div className="space-y-1">
              {FAQ_ITEMS.map((faq, i) => (
                <div key={i} className="border border-border/50">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-civic-green/5 transition-colors"
                  >
                    {expandedFaq === i ? (
                      <ChevronDown className="w-3 h-3 text-civic-green shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-[11px] text-foreground font-medium">{faq.question}</span>
                  </button>
                  {expandedFaq === i && (
                    <div className="px-3 pb-2 pl-8">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Input */}
      <div className="border-t border-border shrink-0 bg-card">
        <div className="flex items-center">
          <div className="flex items-center gap-1.5 pl-4 pr-2">
            <Terminal className="w-3.5 h-3.5 text-civic-green" />
            <span className="font-mono text-[10px] text-civic-green/60">❯</span>
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask a question about this company or job offer..."
            className="flex-1 bg-transparent border-none outline-none px-2 py-4 text-foreground font-mono text-[12px] placeholder:text-muted-foreground/50"
            disabled={isLoading}
          />
          <button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            className="px-5 py-4 font-mono text-[10px] tracking-widest uppercase font-bold text-civic-green hover:bg-civic-green/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
