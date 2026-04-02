import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExternalLink, Quote, FileText, Image as ImageIcon } from "lucide-react";
import type { JrcStory, ReceiptItem } from "@/lib/jrc-story-schema";
import { CATEGORY_DISPLAY, HEAT_DISPLAY } from "@/lib/jrc-story-schema";
import { useNavigate } from "react-router-dom";

interface ReceiptsDrawerProps {
  story: JrcStory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReceiptItemCard({ item }: { item: ReceiptItem }) {
  if (item.type === "quote") {
    return (
      <div className="border-l-2 border-primary/40 pl-4 py-2">
        <Quote className="w-3.5 h-3.5 text-primary/50 mb-1" />
        <blockquote className="text-foreground/90 italic leading-relaxed text-sm">
          "{item.quote_text}"
        </blockquote>
        {item.source_attribution && (
          <p className="text-muted-foreground text-xs mt-1.5">
            — {item.source_attribution}
            {item.timestamp && <span className="ml-2 opacity-60">{item.timestamp}</span>}
          </p>
        )}
      </div>
    );
  }

  if (item.type === "link") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 p-3 rounded border border-border hover:border-primary/40 transition-colors group"
      >
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</p>
          {item.url && (
            <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
              {new URL(item.url).hostname.replace("www.", "")}
            </p>
          )}
        </div>
      </a>
    );
  }

  if (item.type === "doc") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded border border-border hover:border-primary/40 transition-colors group"
      >
        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</p>
          {item.source_attribution && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">{item.source_attribution}</p>
          )}
        </div>
      </a>
    );
  }

  if (item.type === "screenshot") {
    return (
      <div className="space-y-2">
        {item.url && (
          <img
            src={item.url}
            alt={item.label}
            className="rounded border border-border max-h-64 object-contain w-full"
            loading="lazy"
          />
        )}
        <p className="text-xs text-muted-foreground">{item.label}</p>
      </div>
    );
  }

  return null;
}

export function ReceiptsDrawer({ story, open, onOpenChange }: ReceiptsDrawerProps) {
  const navigate = useNavigate();

  if (!story) return null;

  const heat = HEAT_DISPLAY[story.heat_level];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {CATEGORY_DISPLAY[story.category]}
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ color: heat.color, border: `1px solid ${heat.color}40` }}
            >
              {heat.short}
            </span>
          </div>
          <SheetTitle className="font-serif text-lg text-foreground leading-tight">
            {story.headline_poster}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {story.receipt_items.length} receipt{story.receipt_items.length !== 1 ? "s" : ""} from{" "}
            {story.source_label}
          </p>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {story.receipt_items.map((item) => (
            <ReceiptItemCard key={item.id} item={item} />
          ))}

          {story.receipt_items.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No receipts attached yet.
            </p>
          )}
        </div>

        {/* Entity navigation */}
        <div className="border-t border-border pt-4 space-y-3">
          {story.companies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/jrc/company/${c.slug}`);
                  }}
                  className="text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {c.name} →
                </button>
              ))}
            </div>
          )}

          {story.people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/jrc/person/${p.slug}`);
                  }}
                  className="text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {p.name} →
                </button>
              ))}
            </div>
          )}

          <a
            href={story.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors pt-2"
          >
            <ExternalLink className="w-3 h-3" />
            Read the source
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}