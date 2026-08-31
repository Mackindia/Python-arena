"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send, ArrowLeft, Loader2, CircleDot, Wifi, WifiOff, Check, CheckCheck } from "lucide-react";

type ReadBy = {
  userId: string;
  readAt: string;
};

type Message = {
  senderId: string;
  sender: string;
  senderRole: string;
  text: string;
  readBy: ReadBy[];
  createdAt: string;
};

function ReadReceipt({ readBy, isUser }: { readBy: ReadBy[]; isUser: boolean }) {
  if (!isUser) return null;
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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const setActiveThreadWrapper = (thread: Thread | null) => {
    activeThreadRef.current = thread?._id || null;
    setActiveThread(thread);
  };
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [adminOnline, setAdminOnline] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch threads
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
  }, []);

  // Heartbeat - mark self as online
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/messages/online", { method: "POST" });
    } catch {}
  }, []);

  // Check admin online status
  const checkAdminOnline = useCallback(async () => {
    try {
      const url = activeThreadRef.current
        ? `/api/messages/online?threadId=${activeThreadRef.current}`
        : "/api/messages/online";
      const res = await fetch(url);
      const data = await res.json();
      if (data.online !== undefined) setAdminOnline(data.online);
    } catch {}
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (open) {
      fetchThreads();
      sendHeartbeat();
    }
  }, [open, fetchThreads, sendHeartbeat]);

  // Polling every 5 seconds when chat is open
  useEffect(() => {
    if (open) {
      pollRef.current = setInterval(() => {
        fetchThreads(true);
        sendHeartbeat();
        checkAdminOnline();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, fetchThreads, sendHeartbeat, checkAdminOnline]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    setSending(true);
    setError("");

    try {
      const body =
        view === "new"
          ? { subject: newSubject || "General", text: newMessage.trim() }
          : { threadId: activeThread?._id, text: newMessage.trim() };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send");
        setSending(false);
        return;
      }

      if (data.thread) {
        if (view === "new") {
          setThreads((prev) => [data.thread, ...prev]);
          setActiveThreadWrapper(data.thread);
          setView("chat");
          setNewSubject("");
        } else {
          setActiveThreadWrapper(data.thread);
          setThreads((prev) =>
            prev.map((t) => (t._id === data.thread._id ? data.thread : t))
          );
        }
        setNewMessage("");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setSending(false);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function hasUnread(thread: Thread) {
    return (
      thread.unreadByUser &&
      thread.messages.length > 0 &&
      (thread.messages[thread.messages.length - 1].senderRole === "super_admin" ||
       thread.messages[thread.messages.length - 1].senderRole === "admin")
    );
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/50"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3">
            {view === "chat" ? (
              <button
                onClick={() => {
                  setView("list");
                  setActiveThreadWrapper(null);
                }}
                className="text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : view === "new" ? (
              <button onClick={() => setView("list")} className="text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {view === "chat"
                  ? activeThread?.subject || "Chat"
                  : view === "new"
                  ? "New Message"
                  : "Messages"}
              </p>
              <p className="text-xs text-white/70">
                {view === "chat" ? (
                  <span className="flex items-center gap-1">
                    {adminOnline ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-300" />
                        <span className="text-green-200">Admin online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-white/50" />
                        <span>Admin offline</span>
                      </>
                    )}
                  </span>
                ) : (
                  "Ask a question or report an issue"
                )}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {view === "list" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Start a conversation with the admin
                    </p>
                    <button
                      onClick={() => setView("new")}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-indigo-500/25"
                    >
                      <Send className="h-4 w-4" />
                      New Message
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {threads.map((thread) => (
                      <button
                        key={thread._id}
                        onClick={() => {
                          setActiveThreadWrapper(thread);
                          setView("chat");
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white"
                      >
                        <div className="mt-0.5">
                          {hasUnread(thread) ? (
                            <CircleDot className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm ${
                                hasUnread(thread)
                                  ? "font-semibold text-slate-900"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {thread.subject}
                            </p>
                            <span className="ml-2 shrink-0 text-xs text-slate-400">
                              {formatTime(thread.updatedAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {thread.messages[thread.messages.length - 1]?.text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!loading && (
                  <div className="border-t border-slate-100 p-3">
                    <button
                      onClick={() => setView("new")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      <Send className="h-4 w-4" />
                      New Message
                    </button>
                  </div>
                )}
              </>
            )}

            {view === "new" && (
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Message
                </button>
              </div>
            )}

            {view === "chat" && activeThread && (
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {activeThread.messages.map((msg, i) => {
                    const isUser = msg.senderRole !== "super_admin" && msg.senderRole !== "admin";
                    return (
                      <div
                        key={i}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isUser
                              ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                              : "bg-white border border-slate-200 text-slate-800"
                          }`}
                        >
                          <p className={`text-[10px] font-medium mb-1 ${isUser ? "text-white/70" : "text-slate-500"}`}>
                            {msg.sender}
                          </p>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className="flex items-center justify-end gap-0.5 mt-1">
                            <p
                              className={`text-[10px] ${
                                isUser ? "text-white/60" : "text-slate-400"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                            <ReadReceipt readBy={msg.readBy} isUser={isUser} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="border-t border-slate-100 bg-white p-3">
                  {error && <p className="mb-1 text-xs text-red-500">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      placeholder="Reply..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white transition hover:shadow-lg disabled:opacity-50"
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
      )}
    </>
  );
}
