import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionScriptCardProps {
  question: string;
  softerVersion?: string;
  whyAskThis: string;
  category?: string;
}

export function QuestionScriptCard({ question, softerVersion, whyAskThis, category }: QuestionScriptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showSofter, setShowSofter] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border/40 bg-card p-4 space-y-2.5">
      {category && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{category}</span>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug">"{question}"</p>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-muted/40 transition-colors shrink-0"
          aria-label="Copy question"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-civic-green" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>

      {softerVersion && (
        <button
          onClick={() => setShowSofter(!showSofter)}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Softer version
          <ChevronDown className={cn("w-3 h-3 transition-transform", showSofter && "rotate-180")} />
        </button>
      )}
      {showSofter && softerVersion && (
        <p className="text-xs text-foreground/65 italic pl-3 border-l border-primary/30">"{softerVersion}"</p>
      )}

      <p className="text-xs text-foreground/60 leading-relaxed">
        <span className="font-medium text-foreground/70">Why ask this:</span> {whyAskThis}
      </p>
    </div>
  );
}
