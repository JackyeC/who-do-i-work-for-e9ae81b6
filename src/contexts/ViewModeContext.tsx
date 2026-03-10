import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { usePremium } from "@/hooks/use-premium";

export type ViewMode = "candidate" | "recruiter";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isRecruiterMode: boolean;
  canAccessRecruiter: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: "candidate",
  setViewMode: () => {},
  isRecruiterMode: false,
  canAccessRecruiter: false,
});

export const useViewMode = () => useContext(ViewModeContext);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { isPremium } = usePremium();
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("wdiwf-view-mode");
    return saved === "recruiter" ? "recruiter" : "candidate";
  });

  // If user loses premium, revert to candidate
  useEffect(() => {
    if (!isPremium && viewMode === "recruiter") {
      setViewModeState("candidate");
      localStorage.setItem("wdiwf-view-mode", "candidate");
    }
  }, [isPremium, viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("wdiwf-view-mode", mode);
  }, []);

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      setViewMode,
      isRecruiterMode: viewMode === "recruiter",
      canAccessRecruiter: isPremium,
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}
