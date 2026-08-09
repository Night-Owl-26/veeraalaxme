import { useCallback, useState } from "react";

// Wraps an async action with loading/error state so components don't each
// reinvent the same three lines. Returns [run, { loading, error }].
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e.message || "Something went wrong");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, setError };
}
