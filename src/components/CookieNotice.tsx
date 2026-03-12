import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "wdiwf_cookie_accepted";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "true");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto max-w-3xl flex items-center gap-4 justify-between">
        <div className="flex items-start gap-2.5">
          <Cookie className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            We use essential cookies for authentication and session management. No third-party tracking cookies are used.{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={accept} className="shrink-0 text-xs">
          Accept
        </Button>
      </div>
    </div>
  );
}
