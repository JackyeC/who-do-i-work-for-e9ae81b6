import { ReceiptCard } from "./ReceiptCard";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

interface FeaturedReceiptProps {
  article: ReceiptArticle;
}

export function FeaturedReceipt({ article }: FeaturedReceiptProps) {
  return (
    <div className="mb-8">
      <p className="text-[9px] uppercase tracking-[0.5em] text-muted-foreground mb-5 font-mono">
        Featured Story
      </p>
      <ReceiptCard article={article} featured />
    </div>
  );
}
