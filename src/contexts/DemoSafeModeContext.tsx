import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useUserRole } from "@/hooks/use-user-role";

interface DemoSafeModeContextType {
  /** True when demo safe mode is active — masks real data, uses synthetic examples */
  isDemoSafe: boolean;
  /** Toggle manually (only available to internal_test / owner roles) */
  toggleDemoSafe: () => void;
  /** Whether the current user CAN toggle demo mode */
  canToggle: boolean;
}

const DemoSafeModeContext = createContext<DemoSafeModeContextType>({
  isDemoSafe: false,
  toggleDemoSafe: () => {},
  canToggle: false,
});

export const useDemoSafeMode = () => useContext(DemoSafeModeContext);

export function DemoSafeModeProvider({ children }: { children: ReactNode }) {
  const { isInternalTest, isOwner, isLoading } = useUserRole();
  const canToggle = isInternalTest || isOwner;

  const [isDemoSafe, setDemoSafe] = useState(false);

  // Only allow demo mode for authorized roles; reset for unauthorized users
  useEffect(() => {
    if (isLoading) return;
    if (!canToggle) {
      setDemoSafe(false);
      localStorage.removeItem("civiclens-demo-safe");
      return;
    }
    // Restore persisted preference for authorized users
    if (localStorage.getItem("civiclens-demo-safe") === "true") {
      setDemoSafe(true);
    }
    // Auto-activate for internal_test users
    if (isInternalTest && !isDemoSafe) {
      setDemoSafe(true);
      localStorage.setItem("civiclens-demo-safe", "true");
    }
  }, [isLoading, canToggle, isInternalTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDemoSafe = useCallback(() => {
    if (!canToggle) return;
    setDemoSafe((prev) => {
      const next = !prev;
      localStorage.setItem("civiclens-demo-safe", String(next));
      return next;
    });
  }, [canToggle]);

  return (
    <DemoSafeModeContext.Provider value={{ isDemoSafe, toggleDemoSafe, canToggle }}>
      {children}
    </DemoSafeModeContext.Provider>
  );
}
