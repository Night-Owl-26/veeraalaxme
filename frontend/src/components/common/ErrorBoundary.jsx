import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("UI error boundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto mt-16 vc-card p-6 text-center">
          <p className="font-semibold mb-1">Something went wrong</p>
          <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
            This part of the page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button onClick={() => window.location.reload()} className="vc-btn-primary px-4 py-2 text-sm">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
