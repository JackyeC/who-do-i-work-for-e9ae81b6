import { Link } from "react-router-dom";
import { Lock, ArrowRight, MessageSquare, BookOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EarlyAccessGateProps {
  title: string;
  description: string;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
}

const DEFAULT_PRIMARY = { label: "Start Your Audit", to: "/intelligence-check" };
const DEFAULT_SECONDARY = { label: "Read the Methodology", to: "/methodology" };

export function EarlyAccessGate({
  title,
  description,
  primaryCta = DEFAULT_PRIMARY,
  secondaryCta = DEFAULT_SECONDARY,
}: EarlyAccessGateProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="inline-block px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
          <p className="text-xs font-medium text-primary tracking-wide uppercase">
            Early Access · Built by Jackye Clayton
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="rounded-full gap-2 px-6">
            <Link to={primaryCta.to}>
              {primaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full gap-2 px-6">
            <Link to={secondaryCta.to}>
              {secondaryCta.label}
            </Link>
          </Button>
        </div>

        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link to="/ask-jackye" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Ask Jackye
          </Link>
          <Link to="/contact" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Mail className="w-3.5 h-3.5" /> Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
