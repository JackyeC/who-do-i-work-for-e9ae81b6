import { useState } from "react";
import { UPLOAD_TYPES, type UploadType } from "@/lib/responseTemplates";
import { cn } from "@/lib/utils";
import { Upload, Send, ArrowLeft } from "lucide-react";

interface SendItToJackyeProps {
  onSubmit: (type: UploadType, content: string) => void;
  isLoading?: boolean;
  /** Compact mode for embedding in the chat widget */
  compact?: boolean;
}

export function SendItToJackye({ onSubmit, isLoading = false, compact = false }: SendItToJackyeProps) {
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!selectedType || !content.trim() || isLoading) return;
    onSubmit(selectedType, content.trim());
    setContent("");
    setSelectedType(null);
  };

  const selectedConfig = UPLOAD_TYPES.find((t) => t.id === selectedType);

  // Type selection view
  if (!selectedType) {
    return (
      <div className={cn("border-t border-border", compact ? "px-3 py-3" : "px-5 py-5")}>
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 text-primary" />
          <p className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
            Send it to me. Let's walk through it.
          </p>
        </div>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {UPLOAD_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "text-left border border-border/50 bg-surface-2 rounded-lg transition-all",
                "hover:border-primary/30 hover:bg-primary/[0.02]",
                compact ? "p-2" : "p-3"
              )}
            >
              <span className={cn("block", compact ? "text-sm mb-0.5" : "text-lg mb-1")}>
                {type.icon}
              </span>
              <span className={cn("font-medium text-foreground block", compact ? "text-[10px]" : "text-xs")}>
                {type.label}
              </span>
              <span className={cn("text-muted-foreground block mt-0.5", compact ? "text-[9px]" : "text-[11px]")}>
                {type.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Content input view
  return (
    <div className={cn("border-t border-border", compact ? "px-3 py-3" : "px-5 py-5")}>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => {
            setSelectedType(null);
            setContent("");
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-base">{selectedConfig?.icon}</span>
        <p className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
          {selectedConfig?.prompt}
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={selectedConfig?.placeholder}
        rows={compact ? 3 : 5}
        className={cn(
          "w-full bg-surface-2 border border-border/50 rounded-lg p-3 text-foreground resize-none",
          "placeholder:text-muted-foreground focus:outline-none focus:border-primary/40",
          compact ? "text-[11px]" : "text-sm"
        )}
        disabled={isLoading}
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-muted-foreground">
          I'll analyze this against available signals and give you my honest read.
        </p>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          className={cn(
            "inline-flex items-center gap-1.5 bg-primary text-primary-foreground",
            "font-mono text-xs tracking-wider uppercase font-semibold",
            "hover:brightness-110 transition-all disabled:opacity-50",
            compact ? "px-3 py-1.5" : "px-4 py-2"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
}
