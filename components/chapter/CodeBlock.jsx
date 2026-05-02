"use client";

const keywords = new Set([
  "True",
  "False",
  "None",
  "print",
  "type",
  "if",
  "else",
  "for",
  "while",
  "in",
  "and",
  "or",
  "not",
]);

function renderToken(token, key) {
  if (token.startsWith("#")) {
    return (
      <span key={key} className="text-emerald-300">
        {token}
      </span>
    );
  }

  if ((token.startsWith("\"") && token.endsWith("\"")) || (token.startsWith("'") && token.endsWith("'"))) {
    return (
      <span key={key} className="text-amber-300">
        {token}
      </span>
    );
  }

  if (/^\d+(\.\d+)?$/.test(token)) {
    return (
      <span key={key} className="text-sky-300">
        {token}
      </span>
    );
  }

  if (keywords.has(token)) {
    return (
      <span key={key} className="text-violet-300">
        {token}
      </span>
    );
  }

  return <span key={key}>{token}</span>;
}

function tokenize(line) {
  return line.match(/"[^"]*"|'[^']*'|#[^\n]*|\b[A-Za-z_]\w*\b|\d+(?:\.\d+)?|\s+|[^\s]/g) || [];
}

export default function CodeBlock({ code }) {
  const lines = code.split("\n");

  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-100">
      <code>
        {lines.map((line, index) => (
          <div key={`line-${index}`} className="whitespace-pre">
            {tokenize(line).map((token, tokenIndex) =>
              renderToken(token, `tok-${index}-${tokenIndex}`),
            )}
          </div>
        ))}
      </code>
    </pre>
  );
}
