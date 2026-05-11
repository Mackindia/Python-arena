"use client";

import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

type LessonBreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function LessonBreadcrumb({ items }: LessonBreadcrumbProps) {
  return (
    <nav className="mb-6 flex items-center overflow-x-auto">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCurrent = item.current || isLast;

        return (
          <div key={index} className="flex items-center gap-2 whitespace-nowrap">
            {/* Breadcrumb Item */}
            {item.href && !isCurrent ? (
              <Link
                href={item.href}
                className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-sm font-medium ${
                  isCurrent ? "text-slate-200" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            )}

            {/* Separator */}
            {!isLast && (
              <span className="text-slate-500">/</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
