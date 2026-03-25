import { TopBar } from "./TopBar";
import { MarketingNav } from "./MarketingNav";
import { SiteFooter } from "./SiteFooter";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";

const BetaAgreementModal = lazy(() =>
  import("@/components/BetaAgreementModal").then((m) => ({ default: m.BetaAgreementModal }))
);

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Marketing pages use the clean cream nav (MarketingNav) + full SiteFooter.
 * Product/app pages use the dark TopBar + compact Footer.
 * The homepage renders its own nav inline (returned from Index.tsx) so we skip the shell nav.
 * Pricing previously had its own nav — now uses MarketingNav via this shell.
 */
const MARKETING_PAGES = ["/about", "/for-employers", "/contact", "/pricing"];
const NO_SHELL_ROUTES = ["/interview", "/recruiter"];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const isMarketingPage = MARKETING_PAGES.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
  const hideShell = NO_SHELL_ROUTES.includes(location.pathname);

  // Pages that completely manage their own chrome
  if (hideShell) {
    return <>{children}</>;
  }

  // Homepage manages its own nav + footer inside Index.tsx
  if (isHomepage) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <main className="flex-1 min-w-0">
          {children}
        </main>
        <Suspense fallback={null}>
          <BetaAgreementModal />
        </Suspense>
      </div>
    );
  }

  // Marketing pages: clean nav + full footer
  if (isMarketingPage) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <MarketingNav />
        <main className="flex-1 min-w-0">
          {children}
        </main>
        <SiteFooter />
        <Suspense fallback={null}>
          <BetaAgreementModal />
        </Suspense>
      </div>
    );
  }

  // Product/app pages: dark TopBar + compact footer
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <TopBar />
      <main
        className="flex-1 min-w-0"
        style={{ paddingTop: 'var(--nav-offset, 100px)' }}
      >
        {children}
      </main>
      <Footer />
      <Suspense fallback={null}>
        <BetaAgreementModal />
      </Suspense>
    </div>
  );
}
