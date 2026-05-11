"use client";

import { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  code: string;
  language?: string;
};

export default function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const label = useMemo(() => language || "text", [language]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-300/20 bg-[#101215] shadow-[0_0_0_1px_rgba(16,185,129,0.08)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b0d10] px-3 py-2 text-xs uppercase tracking-[0.16em] text-emerald-200">
        <span>{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-slate-200 transition hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            paddingTop: "2.3rem",
            background: "#101215",
            fontSize: "0.85rem",
            lineHeight: "1.45",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
