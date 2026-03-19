import { TopBar } from "./TopBar";
import { Suspense, lazy } from "react";

const BetaAgreementModal = lazy(() =>
  import("@/components/BetaAgreementModal").then((m) => ({ default: m.BetaAgreementModal }))
);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <TopBar />
      <main className="flex-1 min-w-0" style={{ paddingTop: 'var(--nav-offset, 100px)' }}>
        {children}
      </main>
      <Suspense fallback={null}>
        <BetaAgreementModal />
      </Suspense>
    </div>
  );
}
