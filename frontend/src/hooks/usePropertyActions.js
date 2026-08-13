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
      // Property objects everywhere in this app carry viewer-specific state
      // as `_liked`/`_saved` (underscore-prefixed, to distinguish it from
      // core listing fields) — the toggle response itself is just `{ liked }`,
      // so it has to be remapped here, not spread as-is, or callers patching
      // `{ ...p, liked }` silently set a field nothing reads.
      applyLocal?.(id, { _liked: liked });
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [user, showToast]);

  const toggleSave = useCallback(async (id, applyLocal) => {
    if (!user) { showToast("Log in to save listings"); return; }
    try {
      const { saved } = await propertiesApi.save(id);
      applyLocal?.(id, { _saved: saved });
      showToast(saved ? "Saved to your list" : "Removed from saved");
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [user, showToast]);

  return { toggleLike, toggleSave };
}
