import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, DollarSign, Wifi, Award, Shield, Zap } from "lucide-react";

export interface SimulatorConfig {
  company: string;
  role: string;
  baseSalary: string;
  bonus: string;
  equity: string;
  location: string;
  workMode: string;
  negotiationStyle: "direct" | "collaborative" | "reserved";
  riskTolerance: "low" | "balanced" | "high";
  scenario: "salary" | "remote" | "title" | "stability" | "best-and-final";
}

interface Props {
  initialConfig?: Partial<SimulatorConfig>;
  onStart: (config: SimulatorConfig) => void;
}

const SCENARIOS = [
  { value: "salary", label: "Salary Negotiation", icon: DollarSign },
  { value: "remote", label: "Remote / Flexibility", icon: Wifi },
  { value: "title", label: "Title / Level", icon: Award },
  { value: "stability", label: "Team Stability", icon: Shield },
  { value: "best-and-final", label: "Best & Final", icon: Zap },
] as const;

const STYLES = [
  { value: "direct", label: "Direct" },
  { value: "collaborative", label: "Collaborative" },
  { value: "reserved", label: "Reserved" },
] as const;

const RISK = [
  { value: "low", label: "Low risk" },
  { value: "balanced", label: "Balanced" },
  { value: "high", label: "High risk" },
] as const;

export function SimulatorSetup({ initialConfig, onStart }: Props) {
  const [config, setConfig] = useState<SimulatorConfig>({
    company: initialConfig?.company || "",
    role: initialConfig?.role || "",
    baseSalary: initialConfig?.baseSalary || "",
    bonus: initialConfig?.bonus || "",
    equity: initialConfig?.equity || "",
    location: initialConfig?.location || "",
    workMode: initialConfig?.workMode || "hybrid",
    negotiationStyle: initialConfig?.negotiationStyle || "collaborative",
    riskTolerance: initialConfig?.riskTolerance || "balanced",
    scenario: initialConfig?.scenario || "salary",
  });

  const update = <K extends keyof SimulatorConfig>(key: K, val: SimulatorConfig[K]) =>
    setConfig((p) => ({ ...p, [key]: val }));

  const canStart = config.company.trim() && config.role.trim();

  return (
    <Card className="rounded-xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Set Up Your Practice Session
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us about the offer and how you like to negotiate. We'll simulate a realistic conversation.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Scenario */}
        <div>
          <Label className="text-xs text-muted-foreground font-medium">What do you want to practice?</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              return (
                <Badge
                  key={s.value}
                  variant={config.scenario === s.value ? "default" : "outline"}
                  className="cursor-pointer text-xs gap-1 py-1.5 px-3"
                  onClick={() => update("scenario", s.value)}
                >
                  <Icon className="w-3 h-3" /> {s.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Company & Role */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Company</Label>
            <Input value={config.company} onChange={(e) => update("company", e.target.value)} placeholder="e.g. Acme Inc" className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Input value={config.role} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Product Manager" className="h-9 text-sm mt-1" />
          </div>
        </div>

        {/* Offer Details */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Base Salary</Label>
            <Input value={config.baseSalary} onChange={(e) => update("baseSalary", e.target.value)} placeholder="$120,000" className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Bonus</Label>
            <Input value={config.bonus} onChange={(e) => update("bonus", e.target.value)} placeholder="$10,000" className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Equity</Label>
            <Input value={config.equity} onChange={(e) => update("equity", e.target.value)} placeholder="$50,000 RSU" className="h-9 text-sm mt-1" />
          </div>
        </div>

        {/* Style & Risk */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground font-medium">Your style</Label>
            <div className="flex gap-1.5 mt-1.5">
              {STYLES.map((s) => (
                <Badge
                  key={s.value}
                  variant={config.negotiationStyle === s.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => update("negotiationStyle", s.value)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground font-medium">Risk tolerance</Label>
            <div className="flex gap-1.5 mt-1.5">
              {RISK.map((r) => (
                <Badge
                  key={r.value}
                  variant={config.riskTolerance === r.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => update("riskTolerance", r.value)}
                >
                  {r.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={() => onStart(config)} disabled={!canStart} className="w-full gap-2">
          <MessageSquare className="w-4 h-4" /> Start Practice Session
        </Button>
      </CardContent>
    </Card>
  );
}
