import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Embeddable version of PeoplePuzzles — no auth gate, no shell, no popups.
 * Supports query params:
 *   ?theme=light|dark   — pass theme preference to iframe
 *   ?brand=0            — hide WDIWF branding bar
 *   ?embed=1            — (informational, always true on this route)
 */
const PeoplePuzzlesEmbed = () => {
  const [searchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const theme = searchParams.get("theme") || "dark";
  const showBrand = searchParams.get("brand") !== "0";

  const bg = theme === "light" ? "#FFFFFF" : "#0A0A0E";
  const brandBg = theme === "light" ? "#F5F5F0" : "#111115";
  const brandColor = theme === "light" ? "#333" : "#999";

  // Forward postMessage from game iframe to parent embedder
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type?.startsWith("Who Do I Work For_")) {
      window.parent?.postMessage(event.data, "*");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Prevent scroll bounce on iOS
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const brandHeight = showBrand ? 32 : 0;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: bg, display: "flex", flexDirection: "column" }}>
      {showBrand && (
        <div
          style={{
            height: brandHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: brandBg,
            borderBottom: `1px solid ${theme === "light" ? "#E0E0E0" : "#222"}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: brandColor }}>
            PEOPLEPUZZLES™ by WHO DO I WORK FOR
          </span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/peoplepuzzles-app.html"
        title="PeoplePuzzles™ by Who Do I Work For"
        style={{
          width: "100%",
          flex: 1,
          border: "none",
          display: "block",
        }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default PeoplePuzzlesEmbed;
