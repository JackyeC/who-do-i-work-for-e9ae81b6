import { ReceiptCard } from "./ReceiptCard";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

interface FeaturedReceiptProps {
  article: ReceiptArticle;
}

export function FeaturedReceipt({ article }: FeaturedReceiptProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
          Featured Story
        </span>
      </div>
      <ReceiptCard article={article} featured />
    </div>
  );
}
