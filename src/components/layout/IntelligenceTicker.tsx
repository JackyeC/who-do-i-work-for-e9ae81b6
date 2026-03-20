import { useTickerItems, getTickerItemColor } from "@/hooks/use-ticker-items";

const FALLBACK_MESSAGE =
  "WDIWF is monitoring 850+ companies across FEC, SEC, OSHA, NLRB, BLS, and USASpending.gov — intelligence updates as new filings are detected.";

export function IntelligenceTicker() {
  const { data: items } = useTickerItems();

  const hasRealItems = items && items.length > 0;

  const totalChars = hasRealItems
    ? items.reduce((sum, i) => sum + (i.company_name?.length || 0) + i.message.length + (i.source_tag?.length || 0) + 10, 0)
    : FALLBACK_MESSAGE.length;
  const duration = Math.max(60, Math.min((totalChars * 18) / 60, 180));

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden whitespace-nowrap h-[36px] flex items-center bg-background border-b border-border"
      style={{ zIndex: 1001 }}
    >
      {hasRealItems ? (
        <div
          className="ticker-track"
          style={{ ["--ticker-duration" as string]: `${duration}s` }}
        >
          {[...items, ...items].map((item, i) => (
            <span key={`${item.id}-${i}`} className="inline-flex items-center">
              <span
                className="inline-block w-[3px] h-[18px] rounded-sm mr-2 shrink-0"
                style={{ background: getTickerItemColor(item.item_type) }}
              />
              {item.company_name && (
                <>
                  <span className="font-sans text-ticker font-bold text-foreground">
                    {item.company_name}
                  </span>
                  <span className="text-primary mx-1 font-normal">:</span>
                </>
              )}
              <span className="font-sans text-ticker font-normal text-muted-foreground">
                {item.message}
              </span>
              {item.source_tag && (
                <span className="font-sans text-[10px] text-muted-foreground/50 ml-1.5">
                  · {item.source_tag}
                </span>
              )}
              <span className="text-primary mx-4 text-ticker">·</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <span className="font-sans text-ticker font-normal text-muted-foreground">
            {FALLBACK_MESSAGE}
          </span>
        </div>
      )}
    </div>
  );
}
