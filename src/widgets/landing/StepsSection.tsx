"use client";

import { motion } from "framer-motion";
import BlurText from "@/widgets/landing/components/reactbits/BlurText";
import TextType from "@/widgets/landing/components/reactbits/TextType";
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
          <h2 className="mx-auto flex flex-wrap items-center justify-center gap-x-3 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-tight">
            <BlurText
              as="span"
              text="From"
              delay={120}
              animateBy="words"
              direction="top"
              className="justify-center text-ink"
            />
            <BlurText
              as="span"
              text="draft"
              delay={140}
              animateBy="words"
              direction="top"
              className="justify-center text-ink"
            />
            <BlurText
              as="span"
              text="to"
              delay={160}
              animateBy="words"
              direction="top"
              className="justify-center text-ink"
            />
            <BlurText
              as="span"
              text="insights"
              delay={180}
              animateBy="words"
              direction="top"
              className="justify-center text-accent"
            />
          </h2>
          <TextType
            as="p"
            text="A simple flow that matches the core Formsify experience: build, structure, publish, and review."
            className="mx-auto mt-5 block max-w-2xl text-base leading-relaxed text-ink-muted"
            typingSpeed={18}
            deletingSpeed={8}
            pauseDuration={1200}
            loop={false}
            showCursor={false}
            startOnVisible={true}
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -56, y: 10 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.32 }}
              transition={{
                duration: 0.68,
                delay: index * 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
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
