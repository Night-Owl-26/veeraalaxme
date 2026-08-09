import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export default function MessageThread({ otherUserName, messages, currentUserId, onSend, typing }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--line)" }}>
        <span className="font-semibold text-sm">{otherUserName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5" aria-live="polite">
        {messages.length === 0 && <p className="text-sm text-center mt-6" style={{ color: "var(--ink-muted)" }}>Say hello to start the conversation.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] sm:max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words"
              style={m.senderId === currentUserId ? { background: "var(--brick)", color: "#fff" } : { background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && <p className="text-xs italic" style={{ color: "var(--ink-muted)" }}>{otherUserName} is typing…</p>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="p-3 border-t flex gap-2" style={{ borderColor: "var(--line)" }}>
        <input className="vc-input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        <button type="submit" className="vc-btn-primary px-3.5 min-w-[44px]" aria-label="Send message"><Send size={15} /></button>
      </form>
    </div>
  );
}
