import { TopBar } from "./TopBar";
import { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";

const BetaAgreementModal = lazy(() =>
  import("@/components/BetaAgreementModal").then((m) => ({ default: m.BetaAgreementModal }))
);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <TopBar />
      <main
        className="flex-1 min-w-0"
        style={{ paddingTop: isHomepage ? 0 : 'var(--nav-offset, 100px)' }}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BetaAgreementModal />
      </Suspense>
    </div>
  );
}
