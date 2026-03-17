import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal, Send, Sparkles, Shield, Users, DollarSign,
  TrendingUp, AlertTriangle, ChevronDown, ChevronRight,
  Loader2, Scan, Database, FileSearch, BarChart3,
  Globe, Scale, Brain, Activity, Fingerprint,
} from "lucide-react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  { label: "Fetching SEC Form DEF 14A...", icon: FileSearch, duration: 700 },
  { label: "Normalizing EEO-1 Demographics...", icon: Database, duration: 600 },
  { label: "Scanning WARN Act Filings...", icon: AlertTriangle, duration: 500 },
  { label: "Cross-referencing BLS Compensation Benchmarks...", icon: DollarSign, duration: 800 },
  { label: "Analyzing Leadership Tenure Patterns...", icon: Users, duration: 600 },
  { label: "Evaluating Workforce Volatility Signals...", icon: Activity, duration: 700 },
  { label: "Computing Inclusive Vibe Score...", icon: Brain, duration: 500 },
  { label: "Generating Intelligence Briefing...", icon: Scan, duration: 400 },
];

const OPENING_MESSAGE: Msg = {
  role: "assistant",
  content: `## 🛡️ Intelligence Advisor — Online

**System:** People Puzzles Proprietary Talent Framework v2.6
**Engine:** WDIWF Intelligence Engine
**Status:** All intelligence feeds active

---

I cross-reference **SEC filings**, **EEO-1 data**, **labor market benchmarks**, **WARN notices**, and **workforce signals** to deliver objective intelligence briefings.

Select an intelligence category below, or ask me anything about a company, offer, or career decision.

*Run the chain first. Always.*`,
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the Intelligence Advisor system?',
    answer: "The Intelligence Advisor is a specialized AI engine built on the People Puzzles proprietary talent framework. Unlike generic chatbots, this system is designed to think like a veteran Head of Talent. It doesn't just 'chat' — it cross-references SEC filings, EEO-1 data, labor market benchmarks, and social signals to provide an objective intelligence briefing.",
  },
  {
    question: 'What methodology powers the intelligence engine?',
    answer: "The intelligence engine is built on 15+ years of Talent Acquisition expertise across global tech firms. The methodology includes Signal Weighting (weighting data points most commonly associated with workplace transparency), Normalization (standardizing messy corporate reporting into clear insights), and Risk Detection (spotting 'red flag' patterns that standard algorithms miss).",
  },
  {
    question: "How is the intelligence generated?",
    answer: "The system cross-references public filings, federal databases, and open records to surface workforce transparency signals — not opinions.",
  },
];

// Typewriter text component for scan log
function ScanLogLine({ text, isActive }: { text: string; isActive: boolean }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!isActive) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, isActive]);

  return (
    <span className={cn(
      "font-mono text-[10px] tracking-wider transition-colors duration-300",
      isActive ? "text-civic-green" : "text-civic-green/40"
    )}>
      <span className="text-civic-green/60 mr-1">❯</span>
      {displayed}
      {isActive && <span className="animate-pulse ml-0.5">▊</span>}
    </span>
  );
}

export default function AskJackyePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanPhase, setScanPhase] = useState(-1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
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
    setCompletedPhases([]);
    for (let i = 0; i < SCAN_PHASES.length; i++) {
      setScanPhase(i);
      await new Promise((r) => setTimeout(r, SCAN_PHASES[i].duration));
      setCompletedPhases((prev) => [...prev, i]);
    }
    setScanPhase(-1);
    setCompletedPhases([]);
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

    runScanAnimation();

    let assistantSoFar = "";
    const apiMessages = [...messages.filter((m) => m !== OPENING_MESSAGE), userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "**⚠️ SESSION EXPIRED** — Please sign in again to access the Intelligence Advisor." },
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
            ? "**⚠️ RATE LIMITED** — Intelligence systems at capacity. Try again in a moment."
            : resp.status === 402
            ? "**⚠️ CREDITS EXHAUSTED** — Add credits to continue using the Intelligence Advisor."
            : errData.error || "**⚠️ SYSTEM ERROR** — Intelligence scan failed. Try again.";
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
        { role: "assistant", content: "**⚠️ CONNECTION LOST** — Unable to reach intelligence systems. Try again." },
      ]);
    }

    setIsLoading(false);
  };

  const isScanning = scanPhase >= 0;

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
                className="w-10 h-10 object-cover border border-civic-green/30"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-civic-green rounded-full border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-civic-green" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">
                  Your Intelligence Advisor
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                WDIWF Intelligence Engine · Framework v2.6
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-civic-green/20 bg-civic-green/5">
              <Fingerprint className="w-3 h-3 text-civic-green/70" />
              <span className="font-mono text-[9px] text-civic-green/70 tracking-wider">
                ENCRYPTED
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-civic-green animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-civic-green/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-civic-green/30" />
              </div>
              <span className="font-mono text-[9px] text-civic-green/80 tracking-widest uppercase">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Progress Panel */}
      {isScanning && (
        <div className="border-b border-civic-green/20 bg-civic-green/[0.03] shrink-0 animate-fade-in">
          <div className="px-6 py-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Scan className="w-3.5 h-3.5 text-civic-green animate-pulse" />
              <span className="font-mono text-[9px] tracking-widest uppercase text-civic-green font-bold">
                Intelligence Scan Active
              </span>
              <div className="flex-1 h-px bg-civic-green/20 ml-2" />
              <span className="font-mono text-[9px] text-civic-green/60">
                {scanPhase + 1}/{SCAN_PHASES.length}
              </span>
            </div>
            {SCAN_PHASES.map((phase, i) => {
              const isCompleted = completedPhases.includes(i);
              const isActive = scanPhase === i;
              const isVisible = i <= scanPhase;
              if (!isVisible) return null;
              return (
                <div key={i} className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-[10px] text-civic-green/50">✓</span>
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 text-civic-green animate-spin" />
                  ) : null}
                  <ScanLogLine text={phase.label} isActive={isActive} />
                </div>
              );
            })}
            {/* Progress bar */}
            <div className="h-1 bg-muted/50 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-civic-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((scanPhase + 1) / SCAN_PHASES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Prompts — shown at start */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 border-b border-border bg-card/50 shrink-0">
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-3">
            ▸ Select Intelligence Category
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {INTELLIGENCE_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                className="group flex items-start gap-2.5 p-3 border border-border/60 bg-background hover:border-civic-green/40 hover:bg-civic-green/5 transition-all text-left"
              >
                <p.icon className={cn("w-4 h-4 mt-0.5 shrink-0 transition-colors group-hover:text-civic-green", p.color)} />
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
              "px-6 py-5 border-b border-border/30 text-[13px] leading-relaxed",
              msg.role === "assistant"
                ? "bg-civic-green/[0.02] border-l-2 border-l-civic-green/60"
                : "bg-card/60 border-l-2 border-l-muted-foreground/20"
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {msg.role === "assistant" ? (
                <>
                  <Terminal className="w-3 h-3 text-civic-green" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-civic-green font-bold">
                    Intelligence Advisor
                  </span>
                  <span className="font-mono text-[9px] text-civic-green/40 ml-1">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                    Query
                  </span>
                </>
              )}
            </div>
            <div className="max-w-4xl pl-5">
              {msg.role === "assistant" ? (
                <div className={cn(
                  "prose prose-sm max-w-none",
                  // Typography
                  "text-foreground",
                  "[&_p]:mb-3 [&_p]:leading-relaxed",
                  // Headers — terminal green, mono
                  "[&_h1]:font-mono [&_h1]:text-civic-green [&_h1]:text-sm [&_h1]:tracking-wider [&_h1]:uppercase [&_h1]:border-b [&_h1]:border-civic-green/20 [&_h1]:pb-2 [&_h1]:mb-4",
                  "[&_h2]:font-mono [&_h2]:text-civic-green [&_h2]:text-xs [&_h2]:tracking-wider [&_h2]:uppercase [&_h2]:mt-6 [&_h2]:mb-3",
                  "[&_h3]:font-mono [&_h3]:text-civic-green [&_h3]:text-xs [&_h3]:tracking-wider [&_h3]:uppercase [&_h3]:mt-5 [&_h3]:mb-2",
                  // Bold & emphasis
                  "[&_strong]:text-civic-green [&_strong]:font-semibold",
                  "[&_em]:text-civic-green/80",
                  // Lists
                  "[&_li]:text-foreground [&_li]:mb-1.5",
                  "[&_ul]:space-y-1",
                  // Tables — intelligence report styling
                  "[&_table]:w-full [&_table]:text-[12px] [&_table]:border-collapse [&_table]:my-4",
                  "[&_thead]:bg-civic-green/10 [&_thead]:border-b [&_thead]:border-civic-green/20",
                  "[&_th]:font-mono [&_th]:text-[10px] [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-civic-green [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold",
                  "[&_td]:px-3 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-border/30 [&_td]:text-foreground",
                  "[&_tr:hover]:bg-civic-green/[0.03]",
                  // Code
                  "[&_code]:text-civic-green [&_code]:bg-civic-green/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[11px] [&_code]:font-mono",
                  // Links
                  "[&_a]:text-civic-blue [&_a]:underline [&_a]:underline-offset-2",
                  // Horizontal rules
                  "[&_hr]:border-civic-green/15 [&_hr]:my-4",
                  // Blockquotes — used for "Jackye's Take"
                  "[&_blockquote]:border-l-2 [&_blockquote]:border-civic-green [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-civic-green/5 [&_blockquote]:italic",
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-muted-foreground font-mono text-[12px]">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="px-6 py-5 border-b border-border/30 bg-civic-green/[0.02] border-l-2 border-l-civic-green/60">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-3 h-3 text-civic-green" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-civic-green font-bold">
                Intelligence Advisor
              </span>
            </div>
            <div className="pl-5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-civic-green animate-spin" />
              <span className="font-mono text-[10px] text-civic-green/70 tracking-wider">
                Compiling intelligence briefing...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* FAQ Section — shown at start */}
      {messages.length <= 1 && (
        <div className="border-t border-border bg-card/30 shrink-0 max-h-[180px] overflow-y-auto">
          <div className="px-6 py-3">
             <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-2">
              ▸ About the Intelligence Engine
            </p>
            <div className="space-y-0.5">
              {FAQ_ITEMS.map((faq, i) => (
                <div key={i} className="border border-border/30">
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
                    <div className="px-3 pb-2 pl-8 animate-fade-in">
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
      <div className="border-t border-civic-green/20 shrink-0 bg-card">
        <div className="flex items-center">
          <div className="flex items-center gap-1.5 pl-5 pr-1">
            <Terminal className="w-3.5 h-3.5 text-civic-green/70" />
            <span className="font-mono text-[11px] text-civic-green/50">❯</span>
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask a question about this company or job offer..."
            className="flex-1 bg-transparent border-none outline-none px-2 py-4 text-foreground font-mono text-[12px] placeholder:text-muted-foreground/40"
            disabled={isLoading}
          />
          <button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            className="px-5 py-4 text-civic-green hover:bg-civic-green/10 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
