"use client";

import { motion } from "framer-motion";
import { Award, BookOpen, Bot, Code2, FolderKanban, ListChecks } from "lucide-react";
import { featureCards } from "@/src/constants/home";

const iconMap = {
  Bot,
  Code2,
  ListChecks,
  FolderKanban,
  BookOpen,
  Award,
};

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-black px-4 pb-20 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Platform Features</h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          A modern learning stack designed for Python and AI mastery from basics to advanced projects.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = iconMap[card.icon as keyof typeof iconMap] ?? Bot;
            return (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <Icon className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{card.description}</p>
            </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
