import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { chatApi } from "../api/chat";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ThreadList from "../components/chat/ThreadList";
import MessageThread from "../components/chat/MessageThread";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import Seo from "../components/common/Seo";

export default function ChatPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    chatApi.listThreads().then((d) => setThreads(d.items)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!threadId) return;
    chatApi.getMessages(threadId).then((d) => setMessages(d.messages)).catch(() => {});
  }, [threadId]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = ({ threadId: tId, message }) => {
      if (tId === threadId) setMessages((prev) => [...prev, message]);
      setThreads((prev) => prev.map((t) => (t.id === tId ? { ...t, lastMessage: message } : t)));
    };
    const onTyping = ({ threadId: tId }) => {
      if (tId === threadId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };
    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [socket, threadId]);

  const activeThread = threads.find((t) => t.id === threadId);

  const send = useCallback(async (text) => {
    if (!threadId) return;
    const { message } = await chatApi.sendMessage(threadId, text);
    setMessages((prev) => [...prev, message]);
  }, [threadId]);

  if (loading) return <Spinner label="Loading conversations…" />;

  if (threads.length === 0) {
    return <EmptyState icon={MessageCircle} title="No conversations yet" description="Message a seller from any listing page to start one." />;
  }

  return (
    <div id="main-content" className="vc-card overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: 420 }}>
      <Seo title="Chat" noindex />
      <div className={`w-full sm:w-64 shrink-0 border-r overflow-y-auto ${threadId ? "hidden sm:block" : "block"}`} style={{ borderColor: "var(--line)" }}>
        <ThreadList threads={threads} activeId={threadId} onSelect={(id) => navigate(`/chat/${id}`)} />
      </div>

      {threadId && activeThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          <button onClick={() => navigate("/chat")} className="sm:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border-b" style={{ color: "var(--ink-muted)", borderColor: "var(--line)" }}>
            <ArrowLeft size={13} /> All conversations
          </button>
          <MessageThread otherUserName={activeThread.otherUser.name} messages={messages} currentUserId={user.id} onSend={send} typing={typing} />
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center">
          <div className="text-center px-6">
            <span className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--surface)" }}>
              <MessageCircle size={26} style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
            </span>
            <p className="font-semibold">Select a conversation</p>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>Pick a thread on the left to see your messages.</p>
          </div>
        </div>
      )}
    </div>
  );
}
