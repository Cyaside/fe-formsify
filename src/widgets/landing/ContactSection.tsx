"use client";

import Container from "@/shared/ui/Container";
import SectionHeading from "@/shared/ui/SectionHeading";

export default function ContactSection() {
  return (
    <section id="contact" className="bg-page py-20 md:py-28">
      <Container className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Contact"
            title="Want to build a better form workflow?"
            description="Send a message and tell us what kind of form experience you want to build with Formsify."
          />
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <p className="text-sm text-ink-muted">Email</p>
              <p className="mt-2 text-base font-semibold text-ink">hello@formsify.id</p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <p className="text-sm text-ink-muted">Office</p>
              <p className="mt-2 text-base font-semibold text-ink">Formsify Creative Lab, Jakarta</p>
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-4 rounded-[32px] border border-border bg-surface p-8 shadow-soft">
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
        </form>
      </Container>
    </section>
  );
}
