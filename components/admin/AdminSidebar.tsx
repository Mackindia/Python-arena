"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: "🏠" },
    { label: "Upload Lesson", href: "/admin/upload", icon: "📤" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div className="admin-sidebar bg-slate-900 border-r border-slate-700 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Admin Panel</h2>
        <p className="text-xs text-slate-400">Manage lessons & courses</p>
      </div>

      <nav className="space-y-2 mb-8">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <Link
        href="/"
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-all"
      >
        <span className="text-xl">🏠</span>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
    </div>
  );
};

export default AdminSidebar;
