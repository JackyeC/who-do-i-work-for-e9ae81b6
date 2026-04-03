import { useMemo } from "react";
import { useTickerItems, getTickerItemColor } from "@/hooks/use-ticker-items";
import { Link, useLocation } from "react-router-dom";
import { differenceInHours, differenceInDays } from "date-fns";
import { TICKER_SEPARATOR } from "@/lib/ticker-filters";

/** Routes where the intelligence ticker should render */
const TICKER_ALLOWED_ROUTES = ["/", "/receipts", "/browse", "/search", "/newsletter", "/rankings"];

function isTickerRoute(pathname: string): boolean {
  return TICKER_ALLOWED_ROUTES.some(r =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );
}

const EMPTY_STATE = "No major new signals detected today";

const FALLBACK_MESSAGE =
  "Who Do I Work For is monitoring 850+ companies across FEC, SEC, OSHA, NLRB, BLS, and USASpending.gov — intelligence updates as new filings are detected.";

/** Classify freshness for display */
function getFreshnessLabel(createdAt: string): { label: string; className: string } | null {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours < 24) return { label: "Updated today", className: "text-green-500/80" };
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days <= 7) return { label: "New this week", className: "text-amber-500/70" };
  return null;
}

/** Priority: high-impact types first, then recency */
function sortTickerItems(items: ReturnType<typeof useTickerItems>["data"]) {
  if (!items) return [];
  const HIGH_IMPACT = new Set(["warn_act", "nlrb", "osha", "pac_political", "lobbying"]);

  return [...items].sort((a, b) => {
    const aHigh = HIGH_IMPACT.has(a.item_type) ? 0 : 1;
    const bHigh = HIGH_IMPACT.has(b.item_type) ? 0 : 1;
    if (aHigh !== bHigh) return aHigh - bHigh;
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function IntelligenceTicker() {
  const { data: items } = useTickerItems();
  const location = useLocation();

  const sorted = useMemo(() => sortTickerItems(items), [items]);
  const hasRealItems = sorted.length > 0;

  // Only render on allowed routes — prevents duplication on company dossier/profile pages
  if (!isTickerRoute(location.pathname)) {
    return null;
  }

  const totalChars = hasRealItems
    ? sorted.reduce(
        (sum, i) =>
          sum + (i.company_name?.length || 0) + i.message.length + (i.source_tag?.length || 0) + 20,
        0,
      )
    : FALLBACK_MESSAGE.length;

  // Slower duration for readability — slight pause effect via step-based CSS
  const duration = Math.max(140, Math.min((totalChars * 22) / 40, 360));

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden whitespace-nowrap h-[36px] flex items-center bg-background border-b border-border/60"
      style={{ zIndex: 1001 }}
    >
      {/* Pulsing "LIVE" indicator */}
      <div className="flex items-center gap-1.5 pl-3 pr-2 shrink-0 border-r border-border/30 h-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="font-sans text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          Live
        </span>
      </div>

      {hasRealItems ? (
        <div
          className="ticker-track"
          style={{ ["--ticker-duration" as string]: `${duration}s` }}
        >
          {[...sorted, ...sorted].map((item, i) => {
            const freshness = getFreshnessLabel(item.created_at);
            const slug =
              item.company_slug ||
              (item.company_name
                ? item.company_name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                : null);

            return (
              <span key={`${item.id}-${i}`} className="inline-flex items-center">
                {/* Severity bar */}
                <span
                  className="inline-block w-[3px] h-[18px] rounded-sm mr-2 shrink-0"
                  style={{ background: getTickerItemColor(item.item_type) }}
                />

                {/* Company name — bold link */}
                {item.company_name && slug && (
                  <>
                    <Link
                      to={`/dossier/${slug}`}
                      className="font-sans text-ticker font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.company_name}
                    </Link>
                    <span className="text-muted-foreground/40 mx-1.5 font-normal">—</span>
                  </>
                )}

                {/* Signal message */}
                <span className="font-sans text-ticker font-normal text-muted-foreground">
                  {item.message}
                </span>

                {/* Source tag */}
                {item.source_tag && (
                  <span className="font-sans text-[11px] text-muted-foreground/40 ml-1.5 uppercase tracking-wide">
                    ({item.source_tag})
                  </span>
                )}

                {/* Freshness indicator */}
                {freshness && (
                  <span className={`font-sans text-[11px] ml-2 ${freshness.className}`}>
                    {freshness.label}
                  </span>
                )}

                {/* Separator */}
                <span className="text-border mx-5 text-ticker select-none">{TICKER_SEPARATOR}</span>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full px-4">
          <span className="font-sans text-ticker font-normal text-muted-foreground">
            {EMPTY_STATE}
          </span>
        </div>
      )}
    </div>
  );
}
