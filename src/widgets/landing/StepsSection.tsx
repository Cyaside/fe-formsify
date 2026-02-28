"use client";

import { motion } from "framer-motion";
import Container from "@/shared/ui/Container";

const steps = [
  {
    title: "Create a Draft Form",
    desc: "Start with the form title and description, then save it as a draft before publishing.",
    color: "var(--accent-700)",
    bg: "var(--surface)",
  },
  {
    title: "Arrange Sections and Questions",
    desc: "Add the right question types and organize the order so the form is easy to follow.",
    color: "var(--warning)",
    bg: "var(--surface)",
  },
  {
    title: "Publish and Share",
    desc: "Publish the form when ready, then send the public link to respondents.",
    color: "var(--success)",
    bg: "var(--surface)",
  },
  {
    title: "Track Responses",
    desc: "Review submissions, answer details, and response summaries for quick evaluation.",
    color: "var(--danger)",
    bg: "var(--surface)",
  },
];

export default function StepsSection() {
  return (
    <motion.section
      id="steps"
      className="relative overflow-hidden py-20 md:py-28"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Container>
        <div className="relative z-10 mb-6 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">Workflow</p>
          <h2 className="font-extrabold leading-tight text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            From <span className="text-accent">draft</span> to <span className="text-accent">insights</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
            A simple flow that matches the core Formsify experience: build, structure, publish, and review.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.32 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
              className={`step-card relative flex-1 rounded-[28px] border border-border px-8 py-6 text-ink shadow-soft transition md:px-12 md:first:ml-0 md:-ml-6 ${
                index === 0 ? "z-40" : index === 1 ? "z-30" : index === 2 ? "z-20" : "z-10"
              }`}
              style={{ backgroundColor: step.bg }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-[28px]" style={{ backgroundColor: step.color }} aria-hidden="true" />

              <span
                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: step.color, borderColor: step.color }}
              >
                Step {index + 1}
              </span>

              <h3 className="mt-4 break-words text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 break-words text-sm leading-6 text-ink-muted">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </motion.section>
  );
}
