"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CodeBlock from "@/components/chapter/CodeBlock";
import VariableBoxes3D from "@/components/chapter/VariableBoxes3D";

export default function ContentSection({ section }) {
  const [showAnswers, setShowAnswers] = useState(false);

  const sendAiPrompt = (prompt) => {
    window.dispatchEvent(
      new CustomEvent("chapter-ai-prompt", {
        detail: prompt,
      }),
    );
  };

  return (
    <motion.section
      id={section.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-2xl font-semibold text-slate-900">{section.title}</h2>

      <div className="mt-5">
        <h3 className="text-base font-semibold text-slate-900">Concept</h3>
        <p className="mt-2 leading-relaxed text-slate-700">{section.concept}</p>

        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-sm font-semibold text-brand-800">Key Points</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {section.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {section.callout}
        </div>

        {section.has3D ? <div className="mt-5"><VariableBoxes3D /></div> : null}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Program</h3>
          <button
            onClick={() => sendAiPrompt(`Explain the Python code in ${section.title} step by step.`)}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            Explain Code (AI)
          </button>
        </div>
        <CodeBlock code={section.program.code} />
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Output</h3>
        <pre className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {section.program.output}
        </pre>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Practice</h3>
          <button
            onClick={() => setShowAnswers((current) => !current)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
          >
            {showAnswers ? "Hide Answers" : "Reveal Answers"}
          </button>
        </div>

        <div className="mt-3 space-y-4 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">MCQs</p>
            {section.practice.mcq.map((item, idx) => (
              <div key={`${section.id}-mcq-${idx}`} className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p>{idx + 1}. {item.question}</p>
                <p className="mt-1">{item.options.join(" ")}</p>
                {showAnswers ? (
                  <p className="mt-2 rounded-lg bg-white px-3 py-2 text-brand-800">
                    Answer: {item.answer}. {item.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <p className="font-semibold text-slate-900">True / False</p>
            {section.practice.trueFalse.map((item) => (
              <div key={item.statement} className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p>{item.statement}</p>
                {showAnswers ? <p className="mt-2 text-brand-800">Answer: {item.answer}</p> : null}
              </div>
            ))}
          </div>

          <div>
            <p className="font-semibold text-slate-900">Short Questions</p>
            {section.practice.short.map((item, idx) => (
              <div key={`${section.id}-short-${idx}`} className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p>{idx + 1}. {item.question}</p>
                {showAnswers ? (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-brand-800">
                    Sample answer: {item.sampleAnswer}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
