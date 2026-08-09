import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getAccessToken } from "../api/client";

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token }, withCredentials: true });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socketRef.current = socket;

    return () => socket.disconnect();
  }, [isAuthenticated]);

  return <SocketContext.Provider value={{ socket: socketRef.current, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
