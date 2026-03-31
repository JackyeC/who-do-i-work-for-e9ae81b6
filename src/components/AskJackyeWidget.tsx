import { useState, useRef, useEffect } from "react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { ConversationModeSelector } from "./ConversationModeSelector";
import { SendItToJackye } from "./SendItToJackye";
import {
  type ConversationMode,
  CONVERSATION_MODES,
  RESPONSE_TEMPLATES,
  MODE_ANCHOR_LINE,
  type UploadType,
} from "@/lib/responseTemplates";

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
  "How would a recruiter see this company?",
  "What does this signal mean for my career?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-jackye`;

export function AskJackyeWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>("real-talk");
  const [modeSelected, setModeSelected] = useState(false);
  const [showSendIt, setShowSendIt] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModeSelect = (mode: ConversationMode) => {
    setConversationMode(mode);
    setModeSelected(true);
    setShowModeSelector(false);
    // Add anchor line as first assistant message
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: MODE_ANCHOR_LINE }]);
    }
  };

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
    setShowSendIt(false);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    // Prepend system tone based on selected mode
    const modeTemplate = RESPONSE_TEMPLATES[conversationMode];
    const systemContext = modeTemplate.systemPromptTone;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages(prev => [...prev, { role: "assistant", content: "Your session has expired. Please sign in again." }]);
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          systemContext,
          mode: conversationMode,
        }),
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

  const handleSendItSubmit = (type: UploadType, content: string) => {
    const typeLabels: Record<UploadType, string> = {
      interview: "Here are my interview notes",
      recruiter: "Here's a recruiter message I received",
      offer: "Here's my offer letter details",
      "gut-feeling": "Something feels off about this",
    };
    const prefixedContent = `${typeLabels[type]}:\n\n${content}`;
    send(prefixedContent);
  };

  const currentModeConfig = CONVERSATION_MODES.find(m => m.id === conversationMode);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground w-14 h-14 flex items-center justify-center shadow-lg hover:brightness-110 transition-all group"
          title="Check the Receipts"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-4rem)] bg-card border border-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border-b border-border shrink-0">
            <img src={jackyeHeadshot} alt="Jackye Clayton" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-sm font-bold text-primary">Jackye Clayton</div>
              <div className="text-xs text-muted-foreground">Your Career Advocate</div>
            </div>
            {modeSelected && (
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="inline-flex items-center gap-1 font-mono text-micro tracking-wider uppercase px-2 py-0.5 border border-primary/40 text-primary hover:bg-primary/5 transition-all"
                title="Change conversation mode"
              >
                {currentModeConfig?.icon} {currentModeConfig?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
            {!modeSelected && (
              <div className="font-mono text-micro tracking-wider uppercase px-2 py-0.5 border border-primary/40 text-primary">
                AI Coach
              </div>
            )}
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
              <p className="font-serif text-sm text-primary mb-2">Check the Receipts</p>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-[280px]">
                Get personalized career advice, offer analysis, negotiation scripts, and company intelligence — powered by 15+ years of recruiting expertise.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground px-6 py-2.5 font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all"
              >
                Sign in to start
              </button>
              <p className="text-[10px] text-muted-foreground mt-3">Free with any account</p>
            </div>
          )}

          {/* Mode selector (shown initially or when toggled) */}
          {user && showModeSelector && (
            <ConversationModeSelector
              selectedMode={conversationMode}
              onSelect={handleModeSelect}
            />
          )}

          {/* Quick prompts (logged in, mode selected, no messages yet) */}
          {user && modeSelected && messages.length <= 1 && !showModeSelector && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-xs px-2.5 py-1.5 border border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Messages (logged in only) */}
          {user && modeSelected && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {messages.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-[12px]">
                  <p className="font-serif text-sm text-primary mb-2">Welcome.</p>
                  <p>I've reviewed the intelligence report. Before you make any decisions, here's what you need to understand: the connection chain tells you who this company really is — not just who they say they are on their careers page. Ask me anything.</p>
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
          )}

          {/* Send It to Jackye (toggle) */}
          {user && modeSelected && showSendIt && (
            <SendItToJackye
              onSubmit={handleSendItSubmit}
              isLoading={isLoading}
              compact
            />
          )}

          {/* Input (logged in + mode selected) */}
          {user && modeSelected && (
            <div className="shrink-0 border-t border-border">
              {/* Send It toggle */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2 border-b border-border/50">
                <button
                  onClick={() => setShowSendIt(!showSendIt)}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {showSendIt ? "← Back to chat" : "📎 Send it to me — interview notes, offer letters, gut feelings"}
                </button>
              </div>
              <div className="flex">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder="Check the Receipts..."
                  className="flex-1 bg-surface-2 border-none outline-none px-4 py-3 text-foreground font-sans text-[12px] placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <button
                  onClick={() => send(input)}
                  disabled={isLoading || !input.trim()}
                  className="bg-primary text-primary-foreground px-4 font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
