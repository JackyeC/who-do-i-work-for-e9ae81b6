import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimulatorSetup, type SimulatorConfig } from "@/components/negotiation/SimulatorSetup";
import { SimulatorChat } from "@/components/negotiation/SimulatorChat";
import { SessionSummary } from "@/components/negotiation/SessionSummary";
import type { FeedbackData } from "@/components/negotiation/RoundFeedback";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

type Phase = "setup" | "active" | "summary";
type Msg = { role: "user" | "assistant"; content: string };

export default function NegotiationSimulator() {
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<SimulatorConfig | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);

  usePageSEO({
    title: "Negotiation Simulator | Who Do I Work For?",
    description: "Practice real negotiation conversations with an AI-powered simulator. Get round-by-round feedback on your approach.",
  });

  const initialConfig: Partial<SimulatorConfig> = {
    company: searchParams.get("company") || "",
    role: searchParams.get("role") || "",
    baseSalary: searchParams.get("salary") || "",
    scenario: (searchParams.get("scenario") as SimulatorConfig["scenario"]) || "salary",
  };

  const handleStart = (c: SimulatorConfig) => {
    setConfig(c);
    setMessages([]);
    setFeedbacks([]);
    setPhase("active");
  };

  const handleEnd = () => setPhase("summary");

  const handleRestart = () => {
    setMessages([]);
    setFeedbacks([]);
    setPhase("setup");
  };

  const handleTryAgain = () => {
    setMessages([]);
    setFeedbacks([]);
    setPhase("active");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1 flex items-center justify-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Negotiation Simulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Practice what to say before you say it. Get real-time coaching on tone, strategy, and phrasing.
          </p>
        </div>

        {phase === "setup" && (
          <SimulatorSetup initialConfig={initialConfig} onStart={handleStart} />
        )}

        {phase === "active" && config && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Practicing <span className="font-medium text-foreground">{config.scenario.replace("-", " ")}</span> with <span className="font-medium text-foreground">{config.company}</span>
              </p>
            </div>
            <SimulatorChat
              config={config}
              messages={messages}
              setMessages={setMessages}
              feedbacks={feedbacks}
              setFeedbacks={setFeedbacks}
              onEndSession={handleEnd}
            />
          </div>
        )}

        {phase === "summary" && (
          <div className="space-y-4">
            <SessionSummary
              feedbacks={feedbacks}
              totalRounds={messages.filter((m) => m.role === "user").length}
              onTryAgain={config ? handleTryAgain : undefined}
            />
            <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" /> Start New Session
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
