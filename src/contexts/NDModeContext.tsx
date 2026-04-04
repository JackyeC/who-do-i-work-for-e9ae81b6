import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface NDModeContextType {
  isNDMode: boolean;
  toggleNDMode: () => void;
  setNDMode: (on: boolean) => void;
}

const NDModeContext = createContext<NDModeContextType>({
  isNDMode: false,
  toggleNDMode: () => {},
  setNDMode: () => {},
});

const ND_STORAGE_KEY = "wdiwf-nd-mode";

export function NDModeProvider({ children }: { children: ReactNode }) {
  const [isNDMode, setIsNDMode] = useState(() => {
    try {
      const stored = localStorage.getItem(ND_STORAGE_KEY);
      if (stored !== null) return stored === "true";
    } catch {}
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "nd";
  });

  useEffect(() => {
    try { localStorage.setItem(ND_STORAGE_KEY, String(isNDMode)); } catch {}
  }, [isNDMode]);

  const toggleNDMode = useCallback(() => setIsNDMode(prev => !prev), []);
  const setNDMode = useCallback((on: boolean) => setIsNDMode(on), []);

  return (
    <NDModeContext.Provider value={{ isNDMode, toggleNDMode, setNDMode }}>
      {children}
    </NDModeContext.Provider>
  );
}

export function useNDMode() {
  return useContext(NDModeContext);
}
