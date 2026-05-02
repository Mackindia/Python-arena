"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AIPanel() {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const handler = (event) => {
      setPrompt(event.detail);
    };

    window.addEventListener("chapter-ai-prompt", handler);
    return () => window.removeEventListener("chapter-ai-prompt", handler);
  }, []);

  const presetPrompt = (value) => setPrompt(value);

  return (
    <aside id="ai-panel" className="top-24 h-fit rounded-2xl border border-brand-100 bg-white p-5 shadow-sm lg:sticky">
      <h3 className="font-heading text-lg font-semibold text-slate-900">AI Assistant</h3>
      <p className="mt-2 text-sm text-slate-600">Ask your doubt and get instant help for this chapter.</p>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="mt-4 h-24 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500"
        placeholder="Ask your doubt"
      />

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Suggested use: ask for line-by-line explanations, easier definitions, or extra practice.
      </div>

      <div className="mt-4 space-y-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => presetPrompt("Explain this topic in simple Class XI level language.")}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Explain this topic
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => presetPrompt("Generate 5 more practice questions with answers for this topic.")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
        >
          Generate more questions
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => presetPrompt("Simplify the explanation using easier words and one daily-life example.")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
        >
          Simplify explanation
        </motion.button>
      </div>
    </aside>
  );
}
