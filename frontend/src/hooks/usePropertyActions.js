import { useCallback } from "react";
import { propertiesApi } from "../api/properties";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Like/save call the API and report the resulting state back to the caller
// via applyLocal, so each page decides how to patch its own list — this
// hook doesn't own the list itself, since Feed/Saved/Detail all shape
// their data differently.
export function usePropertyActions() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const toggleLike = useCallback(async (id, applyLocal) => {
    if (!user) { showToast("Log in to like listings"); return; }
    try {
      const { liked } = await propertiesApi.like(id);
      applyLocal?.(id, { liked });
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [user, showToast]);

  const toggleSave = useCallback(async (id, applyLocal) => {
    if (!user) { showToast("Log in to save listings"); return; }
    try {
      const { saved } = await propertiesApi.save(id);
      applyLocal?.(id, { saved });
      showToast(saved ? "Saved to your list" : "Removed from saved");
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [user, showToast]);

  return { toggleLike, toggleSave };
}
