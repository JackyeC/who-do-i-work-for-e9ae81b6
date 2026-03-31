import { ReceiptCard } from "./ReceiptCard";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

interface FeaturedReceiptProps {
  article: ReceiptArticle;
  onPosterClick?: (article: ReceiptArticle) => void;
}

export function FeaturedReceipt({ article, onPosterClick }: FeaturedReceiptProps) {
  return (
    <div className="mb-8">
      <p className="text-[9px] uppercase tracking-[0.5em] text-muted-foreground mb-5 font-mono">
        Featured Story
      </p>
      <ReceiptCard article={article} featured onPosterClick={onPosterClick} />
    </div>
  );
}
