import React, { createContext, useCallback, useContext, useState } from "react";
import { useToast } from "./ToastContext";

// Lives at the app root (not inside a page) specifically so the compare
// selection survives navigating from the feed to the compare page and back.
const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const { showToast } = useToast();
  const [compareIds, setCompareIds] = useState([]);

  const toggleCompare = useCallback((id) => {
    setCompareIds((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) { showToast("You can compare up to 3 listings"); return c; }
      return [...c, id];
    });
  }, [showToast]);

  return <CompareContext.Provider value={{ compareIds, toggleCompare }}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
