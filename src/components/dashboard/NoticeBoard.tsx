"use client";

import { useState, useEffect } from "react";
import { Bell, Info, AlertTriangle, GraduationCap, X } from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  level: "info" | "warning" | "exam" | "urgent";
  targetClass: string;
}

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setNotices(data.announcements);
        }
      } catch (err) {
        console.error("Failed to load notices");
      }
    };
    fetchNotices();
  }, []);

  if (!isVisible || notices.length === 0 || !notices[currentIdx]) return null;

  const current = notices[currentIdx];

  const getColors = (level: string) => {
    switch (level) {
      case "urgent": return "bg-red-600 text-white animate-pulse";
      case "warning": return "bg-amber-500 text-black";
      case "exam": return "bg-purple-600 text-white";
      default: return "bg-cyan-600 text-white";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "urgent": return <AlertTriangle className="h-4 w-4" />;
      case "warning": return <Info className="h-4 w-4" />;
      case "exam": return <GraduationCap className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className={`relative flex items-center justify-between px-4 py-2 transition-all ${getColors(current.level)}`}>
      <div className="flex flex-1 items-center justify-center gap-3 overflow-hidden">
        <span className="flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          {getIcon(current.level)}
          {current.level === 'urgent' ? 'Important Update' : current.title}
        </span>
        <div className="h-4 w-px bg-white/20" />
        <p className="truncate text-sm font-medium">
          {current.message}
        </p>
        
        {notices.length > 1 && (
          <button 
            onClick={() => setCurrentIdx((prev) => (prev + 1) % notices.length)}
            className="ml-4 rounded bg-white/20 px-2 py-0.5 text-[10px] hover:bg-white/30"
          >
            Next ({currentIdx + 1}/{notices.length})
          </button>
        )}
      </div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="ml-2 rounded-full p-1 hover:bg-black/10 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
