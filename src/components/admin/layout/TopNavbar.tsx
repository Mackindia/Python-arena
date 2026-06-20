"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Search, ChevronRight } from "lucide-react";
import { ENGINES_LIST } from "@/src/constants/engines";

export default function TopNavbar() {
  const pathname = usePathname();
  const { user } = useUser();

  // Generate breadcrumbs based on pathname
  const generateBreadcrumbs = () => {
    if (pathname === "/admin") return [{ label: "Dashboard", href: "/admin" }];

    const paths = pathname.split("/").filter(Boolean);

    // Find engine title if we are on an engine page
    const engineMatch = ENGINES_LIST.find((e) => pathname.includes(e.href));

    if (engineMatch) {
      return [
        { label: "Dashboard", href: "/admin" },
        { label: engineMatch.category, href: "#" },
        { label: engineMatch.title, href: engineMatch.href }
      ];
    }

    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace("-", " "),
      href: "/" + paths.slice(0, index + 1).join("/")
    }));
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex flex-1">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-slate-600" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-sm font-semibold text-white">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Global Search Stub */}
        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          <div className="relative hidden md:block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Quick search (Cmd+K)"
              className="w-full rounded-full border border-white/10 bg-black/20 py-1.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button className="relative rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="h-6 w-px bg-white/10" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <span className="block text-sm font-semibold text-white leading-tight">
                  {user?.fullName || "Admin"}
                </span>
                <span className="block text-xs font-medium text-cyan-400 leading-tight">
                  {(user?.publicMetadata?.role as string) || "System Administrator"}
                </span>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: "h-9 w-9 border-2 border-slate-800" } }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
