/**
 * LogoMark — the canonical W? + wordmark component.
 *
 * Brand spec (2026):
 *   Dark BG:  W = #FFFFFF, ? = #F0C040, glow on ?
 *   Light BG: W = #000000, ? = #C9920A, no glow
 *   Wordmark dark:  "Who Do I" rgba(255,255,255,0.65) Inter 300
 *                    "WORK FOR" #FFFFFF Inter 800
 *                    "?" #F0C040 Inter 800
 *   Wordmark light: "Who Do I" rgba(0,0,0,0.4) Inter 300
 *                    "WORK FOR" #000000 Inter 800
 *                    "?" #C9920A Inter 800
 */

import { cn } from "@/lib/utils";

interface LogoMarkProps {
  /** Show the full wordmark ("Who Do I WORK FOR?") beside the icon */
  showWordmark?: boolean;
  /** Pixel size of the W? icon. Default 22 */
  iconSize?: number;
  /** Additional className on the wrapper */
  className?: string;
}

export function LogoMark({ showWordmark = false, iconSize = 22, className }: LogoMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Icon: W? */}
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          fontSize: `${iconSize}px`,
          lineHeight: 1,
        }}
      >
        {/* W — adapts to theme via CSS custom property */}
        <span className="logo-w">W</span>
        {/* ? — gold with optional glow in dark mode */}
        <span className="logo-q">?</span>
      </span>

      {showWordmark && (
        <>
          <span className="logo-divider" />
          <span className="inline-flex flex-col leading-none" style={{ fontFamily: "Inter, sans-serif" }}>
            <span className="logo-prefix" style={{ fontSize: "11px", fontWeight: 300, letterSpacing: "0.01em" }}>
              Who Do I
            </span>
            <span style={{ fontSize: "11px", letterSpacing: "0.08em", lineHeight: 1.15, display: "flex", alignItems: "baseline", gap: "1px" }}>
              <span className="logo-bold" style={{ fontWeight: 800, textTransform: "uppercase" as const }}>
                WORK FOR
              </span>
              <span className="logo-q" style={{ fontWeight: 800 }}>?</span>
            </span>
          </span>
        </>
      )}
    </span>
  );
}
