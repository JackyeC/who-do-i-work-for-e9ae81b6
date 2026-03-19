import { useTickerItems, getTickerItemColor } from "@/hooks/use-ticker-items";

const FALLBACK_MESSAGE =
  "WDIWF is monitoring 850+ companies across FEC, SEC, OSHA, NLRB, BLS, and USASpending.gov — intelligence updates as new filings are detected.";

export function IntelligenceTicker() {
  const { data: items } = useTickerItems();

  const hasRealItems = items && items.length > 0;

  // Calculate scroll duration: ~18px per char, ~60px/s, min 60s
  const totalChars = hasRealItems
    ? items.reduce((sum, i) => sum + (i.company_name?.length || 0) + i.message.length + (i.source_tag?.length || 0) + 10, 0)
    : FALLBACK_MESSAGE.length;
  const duration = Math.max(60, Math.min((totalChars * 18) / 60, 180));

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden whitespace-nowrap h-[36px] flex items-center"
      style={{
        background: "#0a0a0e",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1001,
      }}
    >
      {hasRealItems ? (
        <div
          className="ticker-track"
          style={{ ["--ticker-duration" as string]: `${duration}s` }}
        >
          {/* Render items twice for seamless loop */}
          {[...items, ...items].map((item, i) => (
            <span key={`${item.id}-${i}`} className="inline-flex items-center">
              {/* Color-coded left accent */}
              <span
                className="inline-block w-[3px] h-[18px] rounded-sm mr-2 shrink-0"
                style={{ background: getTickerItemColor(item.item_type) }}
              />
              {item.company_name && (
                <>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 700, color: "#f0ebe0" }}>
                    {item.company_name}
                  </span>
                  <span style={{ color: "#f0c040", margin: "0 4px", fontWeight: 400 }}>:</span>
                </>
              )}
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 400, color: "#b8b4a8" }}>
                {item.message}
              </span>
              {item.source_tag && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#3d3a4a", marginLeft: "6px" }}>
                  · {item.source_tag}
                </span>
              )}
              {/* Separator dot */}
              <span style={{ color: "#f0c040", margin: "0 16px", fontSize: "13px" }}>·</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 400, color: "#b8b4a8" }}>
            {FALLBACK_MESSAGE}
          </span>
        </div>
      )}
    </div>
  );
}
