"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  ArrowLeft,
  Loader2,
  CircleDot,
  Wifi,
  WifiOff,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";

type ReadBy = {
  userId: string;
  readAt: string;
};

function ReadReceipt({ readBy, isSenderAdmin }: { readBy: ReadBy[]; isSenderAdmin: boolean }) {
  if (!isSenderAdmin) return null;
  const readCount = readBy?.length || 0;
  return (
    <span className="inline-flex items-center ml-1">
      {readCount > 0 ? (
        <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
      ) : (
        <Check className="h-3.5 w-3.5 text-white/50" />
      )}
    </span>
  );
}

type Message = {
  senderId: string;
  sender: string;
  senderRole: string;
  text: string;
  readBy: ReadBy[];
  createdAt: string;
};

type Thread = {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  subject: string;
  messages: Message[];
  status: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  unreadCount: number;
  updatedAt: string;
};

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function AdminChatBubble() {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const setActiveThreadWrapper = (thread: Thread | null) => {
    activeThreadRef.current = thread?._id || null;
    setActiveThread(thread);
  };
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "chat">("list");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [userOnline, setUserOnline] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [quickTarget, setQuickTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());

  const fetchThreads = useCallback(async (incremental = false) => {
    try {
      const url = incremental
        ? `/api/messages?since=${lastCheckedRef.current}`
        : "/api/messages";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.threads) {
        if (incremental && data.threads.length > 0) {
          setThreads((prev) => {
            const map = new Map(prev.map((t) => [t._id, t]));
            for (const t of data.threads) {
              map.set(t._id, t);
            }
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          });
        } else if (!incremental) {
          setThreads(data.threads);
        }

        if (!incremental) {
          const newUnread = data.threads.filter((t: Thread) => t.unreadByAdmin).length;
          if (newUnread > prevUnreadRef.current && !open) {
            playNotificationSound();
            setPulse(true);
            setTimeout(() => setPulse(false), 1500);
          }
          prevUnreadRef.current = newUnread;
          setUnreadCount(newUnread);
        }

        if (activeThreadRef.current) {
          const updated = data.threads.find((t: Thread) => t._id === activeThreadRef.current);
          if (updated) setActiveThreadWrapper(updated);
        }
        lastCheckedRef.current = new Date().toISOString();
      }
    } catch {}
  }, [open]);

  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/messages/online", { method: "POST" });
    } catch {}
  }, []);

  const checkUserOnline = useCallback(async () => {
    if (!activeThreadRef.current) return;
    try {
      const res = await fetch(`/api/messages/online?threadId=${activeThreadRef.current}`);
      const data = await res.json();
      setUserOnline(data.online || false);
    } catch {}
  }, []);

  useEffect(() => {
    fetchThreads();
    sendHeartbeat();
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchThreads(true);
      sendHeartbeat();
      checkUserOnline();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchThreads, sendHeartbeat, checkUserOnline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  async function handleSend() {
    if (!reply.trim() || !activeThread) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThread._id, text: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
        setSending(false);
        return;
      }
      if (data.thread) {
        setActiveThreadWrapper(data.thread);
        setThreads((prev) =>
          prev.map((t) => (t._id === data.thread._id ? data.thread : t))
        );
        setReply("");
      }
    } catch {
      setError("Network error");
    }
    setSending(false);
  }

  async function handleQuickSend() {
    if (!quickMessage.trim() || !quickTarget) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: quickTarget, text: quickMessage.trim() }),
      });
      const data = await res.json();
      if (data.thread) {
        setThreads((prev) =>
          prev.map((t) => (t._id === data.thread._id ? data.thread : t))
        );
        setQuickMessage("");
        setQuickTarget(null);
      }
    } catch {}
    setSending(false);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function hasUnread(thread: Thread) {
    return (
      thread.unreadByAdmin &&
      thread.messages.length > 0 &&
      thread.messages[thread.messages.length - 1].senderRole !== "super_admin" &&
      thread.messages[thread.messages.length - 1].senderRole !== "admin"
    );
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setView("list");
            setActiveThreadWrapper(null);
          }
        }}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50 ${
          pulse ? "animate-bounce" : ""
        }`}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {pulse && !open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-30" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900 shadow-2xl shadow-emerald-500/10" style={{ height: "550px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
            {view === "chat" ? (
              <button onClick={() => { setView("list"); setActiveThreadWrapper(null); }} className="text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {view === "chat" ? activeThread?.subject || "Chat" : "Messages"}
              </p>
              <p className="text-xs text-white/70">
                {view === "chat"
                  ? userOnline ? "🟢 Online" : "⚪ Offline"
                  : `${unreadCount} unread`}
              </p>
            </div>
            {unreadCount > 0 && view === "list" && (
              <Bell className="h-4 w-4 text-white/80" />
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-900">
            {view === "list" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-500">Users will message you here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {threads.map((thread) => (
                      <button
                        key={thread._id}
                        onClick={() => {
                          setActiveThreadWrapper(thread);
                          setView("chat");
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                      >
                        <div className="mt-0.5">
                          {hasUnread(thread) ? (
                            <CircleDot className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              hasUnread(thread) ? "font-semibold text-white" : "text-slate-300"
                            }`}>
                              {thread.userName}
                            </p>
                            <div className="flex items-center gap-2">
                              {thread.unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                                </span>
                              )}
                              <span className="shrink-0 text-[10px] text-slate-500">
                                {formatTime(thread.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{thread.subject}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {thread.messages[thread.messages.length - 1]?.text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {view === "chat" && activeThread && (
              <div className="flex h-full flex-col">
                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {activeThread.messages.map((msg, i) => {
                    const isSenderAdmin = msg.senderRole === "super_admin" || msg.senderRole === "admin";
                    return (
                      <div key={i} className={`flex ${isSenderAdmin ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isSenderAdmin
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                              : "bg-white/10 text-slate-200 border border-white/10"
                          }`}
                        >
                          <p className="text-[10px] font-medium opacity-70 mb-1">
                            {msg.sender}
                          </p>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className={`flex items-center justify-end gap-0.5 mt-1 ${isSenderAdmin ? "" : ""}`}>
                            <p className={`text-[10px] ${isSenderAdmin ? "text-white/50" : "text-slate-500"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                            <ReadReceipt readBy={msg.readBy} isSenderAdmin={isSenderAdmin} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="shrink-0 border-t border-white/10 bg-slate-800 p-3">
                  {error && <p className="mb-1 text-xs text-red-400">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      placeholder="Reply..."
                      value={reply}
                      onChange={(e) => { setReply(e.target.value); setError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-400/50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!reply.trim() || sending}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition hover:shadow-lg disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
