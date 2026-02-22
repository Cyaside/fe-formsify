"use client";

import Image from "next/image";
import Container from "@/shared/ui/Container";
import SectionHeading from "@/shared/ui/SectionHeading";

const highlights = [
  { title: "Template Adaptif", desc: "Pilih layout siap pakai lalu sesuaikan dengan drag-and-drop." },
  { title: "Validasi Pintar", desc: "Atur aturan validasi tanpa menulis satu baris kode." },
  { title: "Analitik Realtime", desc: "Pantau performa form dan konversi setiap langkah." },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-page py-16 md:py-24">
      <Container className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
        <div className="order-2 md:order-1">
          <SectionHeading
            eyebrow="About"
            title="Buat form cepat dan terintegrasi"
            description={
              "Formsify membantu tim membuat form yang konsisten, cepat, dan siap dipakai — tanpa kompleksitas desain."
            }
          />

          <div className="mt-6 space-y-4">
            {highlights.map((item) => (
              <div key={item.title}>
                <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 md:order-2 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Forms preview"
            width={540}
            height={360}
            className="h-auto w-full max-w-[540px] rounded-2xl border border-border object-cover shadow-soft"
            priority
          />
        </div>
      </Container>
    </section>
  );
}

