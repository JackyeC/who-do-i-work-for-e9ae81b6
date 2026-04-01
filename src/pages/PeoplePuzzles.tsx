import { useEffect, useRef, useCallback } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useLinkedIn } from "@/hooks/use-linkedin";
import { useAuth } from "@/contexts/AuthContext";
import { SignupGate } from "@/components/SignupGate";

const PeoplePuzzles = () => {
  const { user } = useAuth();

  usePageSEO({
    title: "PeoplePuzzles™ — The Recruiting Intelligence Game | Who Do I Work For",
    description: "Every company runs a background check on you. This game teaches you to run one on them. 72 combos. 6 tiers. 8 certifications. Built on real recruiting intelligence by Jackye Clayton.",
    path: "/peoplepuzzles"
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isConnected, shareCertificate, connectLinkedIn } = useLinkedIn();

  // Listen for LinkedIn share requests from the game iframe
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type !== "Who Do I Work For_LINKEDIN_SHARE") return;

    const { playerName, certName, certBadge, insightQuote, imageBase64 } = event.data.payload;
    const iframe = iframeRef.current?.contentWindow;

    if (!isConnected) {
      // Tell the game iframe the user needs to connect LinkedIn first
      iframe?.postMessage({
        type: "Who Do I Work For_LINKEDIN_RESULT",
        success: false,
        needsAuth: true,
        error: "Connect LinkedIn first to auto-share."
      }, "*");
      // Prompt them to connect
      connectLinkedIn("/peoplepuzzles");
      return;
    }

    try {
      const result = await shareCertificate({
        playerName,
        certName,
        certBadge,
        insightQuote,
        imageBase64,
      });
      iframe?.postMessage({
        type: "Who Do I Work For_LINKEDIN_RESULT",
        success: true,
        postId: result.postId,
      }, "*");
    } catch (err: any) {
      if (err.message === "NEEDS_AUTH") {
        iframe?.postMessage({
          type: "Who Do I Work For_LINKEDIN_RESULT",
          success: false,
          needsAuth: true,
          error: "LinkedIn session expired. Reconnecting..."
        }, "*");
        connectLinkedIn("/peoplepuzzles");
      } else {
        iframe?.postMessage({
          type: "Who Do I Work For_LINKEDIN_RESULT",
          success: false,
          error: err.message || "Failed to share on LinkedIn"
        }, "*");
      }
    }
  }, [isConnected, shareCertificate, connectLinkedIn]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">PeoplePuzzles™</h1>
            <p className="text-muted-foreground text-sm">The Recruiting Intelligence Game. 72 combos. 6 tiers. 8 certifications. Built on real recruiting intelligence by Jackye Clayton.</p>
          </div>
          <SignupGate feature="PeoplePuzzles™ game" blurPreview={false} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0E" }}>
      <iframe
        ref={iframeRef}
        src="/peoplepuzzles-app.html"
        title="PeoplePuzzles™ by Who Do I Work For"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default PeoplePuzzles;
