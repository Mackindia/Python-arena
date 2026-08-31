"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  CircleDot,
  ArrowLeft,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  CheckCheck,
} from "lucide-react";

type ReadBy = {
  userId: string;
  readAt: string;
};

function ReadReceipt({ readBy, isAdmin }: { readBy: ReadBy[]; isAdmin: boolean }) {
  if (!isAdmin) return null;
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

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const setActiveThreadWrapper = (thread: Thread | null) => {
    activeThreadRef.current = thread?._id || null;
    setActiveThread(thread);
  };
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [userOnline, setUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());

  const fetchThreads = useCallback(async (incremental = false) => {
    try {
      const url = incremental
        ? `/api/messages?since=${lastCheckedRef.current}`
        : "/api/messages";
      const res = await fetch(url);
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
        if (activeThreadRef.current) {
          const updated = data.threads.find((t: Thread) => t._id === activeThreadRef.current);
          if (updated) setActiveThreadWrapper(updated);
        }
        lastCheckedRef.current = new Date().toISOString();
      }
    } catch {}
    setLoading(false);
  }, []);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/messages/online", { method: "POST" });
    } catch {}
  }, []);

  // Check user online
  const checkUserOnline = useCallback(async () => {
    if (!activeThreadRef.current) return;
    try {
      const res = await fetch(`/api/messages/online?threadId=${activeThreadRef.current}`);
      const data = await res.json();
      setUserOnline(data.online || false);
    } catch {}
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
    sendHeartbeat();
  }, []);

  // Polling every 5 seconds
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  async function handleReply() {
    if (!reply.trim() || !activeThread) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThread._id,
          text: reply.trim(),
        }),
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

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filtered = threads.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = threads.filter((t) => t.unreadByAdmin).length;

  return (
    <div className="mx-auto flex max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl" style={{ height: "min(600px, 80vh)" }}>
      {/* Thread List */}
      <div
        className={`flex w-80 flex-col border-r border-white/10 bg-black/20 ${
          activeThread ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">User Messages</h2>
              <p className="text-xs text-slate-400">
                {openCount > 0 ? `${openCount} unread` : "All caught up"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchThreads();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-400/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">No messages</p>
            </div>
          ) : (
            filtered.map((thread) => (
              <button
                key={thread._id}
                onClick={() => {
                  setActiveThreadWrapper(thread);
                  setThreads((prev) =>
                    prev.map((t) =>
                      t._id === thread._id ? { ...t, unreadByAdmin: false } : t
                    )
                  );
                }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                  activeThread?._id === thread._id ? "bg-white/10" : ""
                }`}
              >
                <div className="mt-0.5">
                  {thread.unreadByAdmin ? (
                    <CircleDot className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        thread.unreadByAdmin
                          ? "font-semibold text-white"
                          : "text-slate-300"
                      }`}
                    >
                      {thread.subject}
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <User className="h-3 w-3 text-slate-500" />
                    <p className="text-xs text-slate-500 truncate">
                      {thread.userName}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {thread.messages[thread.messages.length - 1]?.text}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div
        className={`flex flex-1 flex-col ${
          activeThread ? "flex" : "hidden lg:flex"
        }`}
      >
        {!activeThread ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-4 h-16 w-16 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-300">
              Select a conversation
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose a thread from the left to view and reply
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Thread Header */}
            <div className="shrink-0 flex items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3">
              <button
                onClick={() => setActiveThreadWrapper(null)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
                {activeThread.userName?.[0] || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {activeThread.subject}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-slate-400">
                    {activeThread.userName} &middot; {activeThread.userRole}
                  </p>
                  <span className="flex items-center gap-1 text-[10px]">
                    {userOnline ? (
                      <span className="flex items-center gap-0.5 text-green-400">
                        <Wifi className="h-3 w-3" /> online
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <WifiOff className="h-3 w-3" /> offline
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  activeThread.status === "open"
                    ? "bg-amber-500/10 text-amber-400"
                    : activeThread.status === "replied"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-slate-500/10 text-slate-400"
                }`}
              >
                {activeThread.status}
              </span>
            </div>

            {/* Messages - scrollable, takes remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {activeThread.messages.map((msg, i) => {
                const isAdmin = msg.senderRole === "super_admin" || msg.senderRole === "admin";
                return (
                  <div
                    key={i}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isAdmin
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          : "bg-white/10 text-slate-200 border border-white/10"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-70 mb-1">
                        {msg.sender}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-0.5 mt-1`}>
                        <p
                          className={`text-[10px] ${
                            isAdmin ? "text-white/50" : "text-slate-500"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                        <ReadReceipt readBy={msg.readBy} isAdmin={isAdmin} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input - always visible at bottom */}
            <div className="shrink-0 border-t border-white/10 bg-black/20 p-3">
              {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
              <div className="flex items-end gap-3">
                <textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-400/50"
                />
                <button
                  onClick={handleReply}
                  disabled={!reply.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
