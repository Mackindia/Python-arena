"use client";

import { motion } from "framer-motion";
import { intelligenceTypes } from "@/lib/content";

const chartPoints = [
  [50, 8],
  [82, 18],
  [92, 50],
  [82, 82],
  [50, 92],
  [18, 82],
  [8, 50],
  [18, 18],
];

function polygonFromValues(values, radius = 40) {
  return values
    .map((value, idx) => {
      const angle = (Math.PI * 2 * idx) / values.length - Math.PI / 2;
      const scaled = (value / 100) * radius;
      const x = 50 + Math.cos(angle) * scaled;
      const y = 50 + Math.sin(angle) * scaled;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function IntelligenceChartSection() {
  const intelligenceData = intelligenceTypes;
  const values = intelligenceData.map((item) => item.value);
  const dataPolygon = polygonFromValues(values);

  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[rgba(255,255,255,0.08)] bg-ink-900/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              03 / Intelligence Map
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Different Types of Intelligence
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-300">
            A visual profile based on Gardner&apos;s multiple intelligences, using the same animated
            interaction style as the rest of your platform.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
          <div className="space-y-3">
            {intelligenceData.map((item, idx) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group rounded-2xl border border-[rgba(255,255,255,0.08)] bg-ink-900 p-4 transition-colors duration-300 hover:bg-ink-800"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-100">
                    {item.type}
                  </p>
                  <span className="text-xs font-semibold text-neon">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.value}%` }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.8, delay: idx * 0.08, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${item.color}, rgba(0,255,208,0.95))`,
                      boxShadow: `0 0 18px ${item.color}55`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-ink-900 p-5"
          >
            <svg viewBox="0 0 100 100" className="mx-auto block h-[320px] w-full max-w-[360px]">
              {[12, 22, 32, 40].map((radius) => (
                <polygon
                  key={radius}
                  points={chartPoints
                    .map(([x, y]) => {
                      const scaledX = 50 + ((x - 50) * radius) / 40;
                      const scaledY = 50 + ((y - 50) * radius) / 40;
                      return `${scaledX},${scaledY}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="rgba(255,255,255,0.13)"
                  strokeWidth="0.35"
                />
              ))}

              {chartPoints.map(([x, y], idx) => (
                <line
                  key={`axis-${intelligenceData[idx].type}`}
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.35"
                />
              ))}

              <motion.polygon
                initial={{ opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                points={dataPolygon}
                fill="rgba(0,255,208,0.24)"
                stroke="#00ffd0"
                strokeWidth="1"
              />

              {dataPolygon.split(" ").map((point, idx) => {
                const [x, y] = point.split(",");
                return (
                  <circle
                    key={`dot-${intelligenceData[idx].type}`}
                    cx={x}
                    cy={y}
                    r="1.2"
                    fill="#00ffd0"
                  />
                );
              })}
            </svg>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-ink-300">
              {intelligenceData.map((item, idx) => (
                <div key={`label-${item.type}`} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: idx % 2 === 0 ? "#00ffd0" : "#39c7ff" }}
                  />
                  <span>{item.type}</span>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-neon opacity-10 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
