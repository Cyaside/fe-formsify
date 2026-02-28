"use client";

import { motion } from "framer-motion";
import BlurText from "@/components/BlurText";
import TextType from "@/components/TextType";
import Container from "@/shared/ui/Container";
import SectionHeading from "@/shared/ui/SectionHeading";

export default function ContactSection() {
  return (
    <motion.section
      id="contact"
      className="py-20 md:py-28"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Container className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Contact"
            title={
              <BlurText
                as="span"
                text="Want to build a better form workflow?"
                delay={120}
                animateBy="words"
                direction="top"
                className="justify-start"
              />
            }
            description={
              <TextType
                as="span"
                text="Send a message and tell us what kind of form experience you want to build with Formsify."
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
          <div className="grid gap-4">
            <motion.div
              className="rounded-3xl border border-border bg-surface p-6 shadow-soft"
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm text-ink-muted">Email</p>
              <p className="mt-2 text-base font-semibold text-ink">hello@formsify.id</p>
            </motion.div>
            <motion.div
              className="rounded-3xl border border-border bg-surface p-6 shadow-soft"
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm text-ink-muted">Office</p>
              <p className="mt-2 text-base font-semibold text-ink">Formsify Creative Lab, Jakarta</p>
            </motion.div>
          </div>
        </div>

        <motion.form
          className="flex flex-col gap-4 rounded-[32px] border border-border bg-surface p-8 shadow-soft"
          initial={{ opacity: 0, x: 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Name
            <input
              type="text"
              placeholder="Full name"
              className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Email
            <input
              type="email"
              placeholder="email@company.com"
              className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Message
            <textarea
              rows={4}
              placeholder="Tell us about your form use case"
              className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
            />
          </label>
          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-900"
          >
            Send Message
          </button>
        </motion.form>
      </Container>
    </motion.section>
  );
}
