"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import BlurText from "@/widgets/landing/components/reactbits/BlurText";
import TextType from "@/widgets/landing/components/reactbits/TextType";
import Container from "@/shared/ui/Container";
import SectionHeading from "@/shared/ui/SectionHeading";

const highlights = [
  {
    title: "Flexible question builder",
    desc: "Add short answer, multiple choice, checkbox, and dropdown questions based on your form needs.",
  },
  {
    title: "Multi-section form flow",
    desc: "Split long forms into sections so respondents can fill them out more comfortably.",
  },
  {
    title: "Publish and review responses",
    desc: "Share a public form link, then monitor submissions and response summaries from the dashboard.",
  },
];

export default function AboutSection() {
  return (
    <motion.section
      id="about"
      className="py-16 md:py-24"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Container className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 md:order-1">
          <SectionHeading
            eyebrow="About"
            title={
              <span className="flex flex-wrap items-center gap-x-2">
                <BlurText
                  as="span"
                  text="A"
                  delay={120}
                  animateBy="words"
                  direction="top"
                  className="justify-start text-ink"
                />
                <BlurText
                  as="span"
                  text="form builder"
                  delay={140}
                  animateBy="words"
                  direction="top"
                  className="justify-start text-accent"
                />
                <BlurText
                  as="span"
                  text="for creating, publishing, and reviewing results"
                  delay={160}
                  animateBy="words"
                  direction="top"
                  className="justify-start text-ink"
                />
              </span>
            }
            description={
              <TextType
                as="span"
                text="Formsify supports a clear workflow from draft form setup, question management, and public sharing to submission review and response summaries."
                className="block"
                typingSpeed={20}
                deletingSpeed={8}
                pauseDuration={1200}
                loop={false}
                showCursor={false}
                startOnVisible={true}
              />
            }
          />

          <div className="mt-6 space-y-4">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-soft"
                initial={{ opacity: 0, x: -34 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.52,
                  delay: 0.08 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                    <TextType
                      as="p"
                      text={item.desc}
                      className="mt-1 block text-sm leading-6 text-ink-muted"
                      typingSpeed={20}
                      deletingSpeed={8}
                      pauseDuration={1200}
                      loop={false}
                      showCursor={false}
                      startOnVisible={true}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="order-1 flex items-center justify-center md:order-2">
          <Image
            src="/logo.png"
            alt="Formsify preview"
            width={540}
            height={360}
            className="h-auto w-full max-w-[540px] rounded-2xl border border-border bg-surface object-cover p-6 shadow-soft"
            priority
          />
        </div>
      </Container>
    </motion.section>
  );
}
