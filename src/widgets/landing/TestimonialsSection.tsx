"use client";

import { motion } from "framer-motion";
import Container from "@/shared/ui/Container";

const testimonials = [
  {
    name: "Alya Prasetyo",
    role: "Product Designer",
    quote:
      "Formsify makes form creation feel more structured. Building sections and questions is much easier to manage.",
  },
  {
    name: "Raka Wijaya",
    role: "Growth Lead",
    quote:
      "Publishing forms and reviewing responses in one dashboard helps our team move faster during campaigns.",
  },
  {
    name: "Intan Sari",
    role: "Founder",
    quote: "The response summary view is clear, so we can quickly understand what users submitted.",
  },
  {
    name: "Bima Raharjo",
    role: "Operations",
    quote: "The workflow is simple enough for daily operations, from draft setup to sharing a public link.",
  },
  {
    name: "Nabila Putri",
    role: "Marketing",
    quote: "It is easy to create internal surveys and feedback forms without overcomplicating the setup.",
  },
];

export default function TestimonialsSection() {
  const items = [...testimonials, ...testimonials];

  return (
    <motion.section
      id="testimonials"
      className="relative overflow-hidden py-20 md:py-28"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Container>
        <div className="relative z-10 mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">Reviews</p>
          <h2 className="font-extrabold leading-tight text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            What teams say about <span className="text-accent">Formsify</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
            Feedback from users who build forms, organize questions, and review responses with Formsify.
          </p>
        </div>

        <div className="overflow-hidden">
          <div className="relative">
            <div className="group">
              <div
                className="flex w-max gap-6 py-4"
                style={{ animation: "marquee 38s linear infinite" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.animationPlayState = "paused")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.animationPlayState = "running")}
              >
                {items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    aria-hidden={index >= testimonials.length}
                    className="flex min-w-[260px] max-w-[280px] flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1"
                  >
                    <p className="text-sm leading-6 text-ink-muted">&ldquo;{item.quote}&rdquo;</p>

                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: "var(--accent-700)" }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </motion.section>
  );
}
