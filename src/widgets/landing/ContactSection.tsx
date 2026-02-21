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
            title="Siap membangun form yang terasa premium?"
            description="Tinggalkan pesan, kami bantu merancang flow form yang efisien dan cantik."
          />
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <p className="text-sm text-ink-muted">Email</p>
              <p className="mt-2 text-base font-semibold text-ink">hello@formsify.id</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <p className="text-sm text-ink-muted">Office</p>
              <p className="mt-2 text-base font-semibold text-ink">
                Formsify Creative Lab, Jakarta
              </p>
            </div>
          </div>
        </div>
        <form className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-surface/70 p-8">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
            Nama
            <input
              type="text"
              placeholder="Nama lengkap"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
            Email
            <input
              type="email"
              placeholder="email@company.com"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
            Pesan
            <textarea
              rows={4}
              placeholder="Ceritakan kebutuhan form kamu"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
            />
          </label>
          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-lavender px-6 py-3 text-sm font-semibold text-violet-deep transition hover:-translate-y-0.5 hover:bg-sun"
          >
            Kirim Pesan
          </button>
        </form>
      </Container>
    </section>
  );
}

