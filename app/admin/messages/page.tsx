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
} from "lucide-react";

type Message = {
  sender: string;
  senderRole: string;
  text: string;
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
  updatedAt: string;
};

const STAFF_ROLES = new Set(["super_admin", "admin", "teacher"]);

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [userOnline, setUserOnline] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setCurrentRole(null);
          return;
        }

        const data = await res.json();
        setCurrentRole(data?.user?.role || null);
      } catch {
        setCurrentRole(null);
      } finally {
        setRoleChecked(true);
      }
    }

    loadRole();
  }, []);

  if (!roleChecked) {
    return <div className="flex min-h-[320px] items-center justify-center text-slate-400">Loading messages...</div>;
  }

  if (currentRole !== "super_admin" && currentRole !== "admin") {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 backdrop-blur-xl">
        <div>
          <p className="text-lg font-semibold text-white">Access restricted</p>
          <p className="mt-2 text-sm text-slate-400">
            Only super admin can read or reply to student messages.
          </p>
        </div>
      </div>
    );
  }

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.threads) {
        setThreads(data.threads);
        // Update active thread
        if (activeThread) {
          const updated = data.threads.find((t: Thread) => t._id === activeThread._id);
          if (updated) setActiveThread(updated);
        }
      }
    } catch {}
    setLoading(false);
  }, [activeThread]);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/messages/online", { method: "POST" });
    } catch {}
  }, []);

  // Check user online
  const checkUserOnline = useCallback(async () => {
    if (!activeThread) return;
    try {
      const res = await fetch(`/api/messages/online?threadId=${activeThread._id}`);
      const data = await res.json();
      setUserOnline(data.online || false);
    } catch {}
  }, [activeThread]);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
    sendHeartbeat();
  }, []);

  // Polling every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchThreads();
      sendHeartbeat();
      checkUserOnline();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchThreads, sendHeartbeat, checkUserOnline]);

  // Check online when thread changes
  useEffect(() => {
    if (activeThread) checkUserOnline();
  }, [activeThread, checkUserOnline]);

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
        setActiveThread(data.thread);
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
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
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
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
                  setActiveThread(thread);
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
                    <CircleDot className="h-4 w-4 text-indigo-400" />
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
                    <span className="ml-2 shrink-0 text-[10px] text-slate-500">
                      {formatTime(thread.updatedAt)}
                    </span>
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
                onClick={() => setActiveThread(null)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-sm font-bold text-indigo-400">
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
                const isUserMessage = !STAFF_ROLES.has(msg.senderRole);
                return (
                  <div
                    key={i}
                    className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isUserMessage
                          ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                          : "bg-white text-slate-900 border border-slate-200"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-70 mb-1">
                        {msg.sender}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isUserMessage ? "text-white/50" : "text-slate-500"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
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
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/50"
                />
                <button
                  onClick={handleReply}
                  disabled={!reply.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white transition hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
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
