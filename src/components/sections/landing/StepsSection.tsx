"use client";

"use client"

import Container from "@/components/ui/Container";

const steps = [
  {
    title: "Rancang Struktur",
    desc: "Tentukan field, logic, dan flow yang kamu butuhkan.",
    tone: "from-violet/60 to-violet-deep/80",
  },
  {
    title: "Kustom Visual",
    desc: "Atur warna, tipografi, dan animasi ringan.",
    tone: "from-lavender/70 to-violet/60",
  },
  {
    title: "Publikasi",
    desc: "Bagikan tautan atau embed ke produkmu.",
    tone: "from-rose/60 to-berry/70",
  },
  {
    title: "Optimasi",
    desc: "Pantau data, iterasi, dan tingkatkan konversi.",
    tone: "from-sun/70 to-rose/50",
  },
];

export default function StepsSection() {
  return (
    <section id="steps" className="relative overflow-hidden bg-page py-20 md:py-28">
      {/* decorations removed for this section */}
      <Container>
        <div className="relative z-10 mb-6 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-lavender/80">Workflow</p>
          <h2 className="font-extrabold leading-tight text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Langkah demi langkah yang{" "}
            <span className="text-lavender">saling tersambung</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
            Setiap tahap menyatu, memastikan alur pembuatan form tetap rapi dan efisien.
          </p>
        </div>
        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`step-card relative flex-1 rounded-[28px] border border-white/10 bg-gradient-to-br ${
                step.tone
              } px-8 py-6 md:px-12 text-ink shadow-[0_16px_40px_rgba(8,4,20,0.4)] transition hover:-translate-y-1 md:first:ml-0 md:-ml-6 ${
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

