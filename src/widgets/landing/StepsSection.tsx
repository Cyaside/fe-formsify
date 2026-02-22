"use client"

import Container from "@/shared/ui/Container";

const steps = [
  {
    title: "Rancang Struktur",
    desc: "Tentukan field, logic, dan flow yang kamu butuhkan.",
  },
  {
    title: "Kustom Visual",
    desc: "Atur warna, tipografi, dan animasi ringan.",
  },
  {
    title: "Publikasi",
    desc: "Bagikan tautan atau embed ke produkmu.",
  },
  {
    title: "Optimasi",
    desc: "Pantau data, iterasi, dan tingkatkan konversi.",
  },
];

export default function StepsSection() {
  return (
    <section id="steps" className="relative overflow-hidden bg-page py-20 md:py-28">
      {/* decorations removed for this section */}
      <Container>
        <div className="relative z-10 mb-6 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">Workflow</p>
          <h2 className="font-extrabold leading-tight text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Langkah demi langkah yang{" "}
            <span className="text-accent">saling tersambung</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
            Setiap tahap menyatu, memastikan alur pembuatan form tetap rapi dan efisien.
          </p>
        </div>
        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`step-card relative flex-1 rounded-[28px] border border-border bg-surface px-8 py-6 text-ink shadow-soft transition md:px-12 md:first:ml-0 md:-ml-6 ${
                index === 0 ? "border-accent/30 bg-accent-100/40 dark:bg-accent/8" : ""
              } ${
                index === 0 ? "z-40" : index === 1 ? "z-30" : index === 2 ? "z-20" : "z-10"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Step {index + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink break-words">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted break-words">{step.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

