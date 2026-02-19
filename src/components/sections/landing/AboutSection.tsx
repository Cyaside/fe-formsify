"use client";

import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const highlights = [
  { title: "Template Adaptif", desc: "Pilih layout siap pakai lalu sesuaikan dengan drag-and-drop." },
  { title: "Validasi Pintar", desc: "Atur aturan validasi tanpa menulis satu baris kode." },
  { title: "Analitik Realtime", desc: "Pantau performa form dan konversi setiap langkah." },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-page py-20 md:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-[30%] border border-lavender/30 bg-violet/40" />
          <div className="relative flex h-[320px] items-center justify-center rounded-[36px] border border-white/10 bg-gradient-to-br from-violet-deep/80 via-violet/50 to-rose/40 p-8">
            <div className="absolute left-8 top-8 h-12 w-12 rounded-2xl bg-sun" />
            <div className="absolute bottom-8 right-8 h-12 w-12 rounded-2xl bg-rose" />
            <div className="flex h-44 w-44 items-center justify-center rounded-[36px] border border-white/20 bg-surface/70 text-6xl font-display text-lavender">
              F
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="About Us"
            title="Bangun form yang terasa hidup, cepat, dan konsisten di semua perangkat."
            description={
              "Formsify membantu tim membuat webform modern dalam hitungan menit. Fokus pada pengalaman pengguna, otomatisasi alur, dan data yang siap dianalisis."
            }
          />
          <div className="grid gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-surface/60 p-5 transition hover:-translate-y-1 hover:border-lavender/40"
              >
                <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

