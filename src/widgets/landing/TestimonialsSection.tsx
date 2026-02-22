"use client"

import Container from "@/shared/ui/Container";

const testimonials = [
  {
    name: "Alya Prasetyo",
    role: "Product Designer",
    quote:
      "Formsify bikin flow input data jadi konsisten, dari mobile sampai desktop terasa mulus.",
  },
  {
    name: "Raka Wijaya",
    role: "Growth Lead",
    quote:
      "Setup validasi dan logic form jauh lebih cepat. Conversion rate naik tanpa drama.",
  },
  {
    name: "Intan Sari",
    role: "Founder",
    quote: "Dashboard-nya rapi, jadi gampang melihat form mana yang perform terbaik.",
  },
  {
    name: "Bima Raharjo",
    role: "Operations",
    quote: "Integrasi data dan notifikasi otomatisnya bikin tim kami jauh lebih sigap.",
  },
  {
    name: "Nabila Putri",
    role: "Marketing",
    quote: "Tampilan form bisa di-branding total tanpa harus panggil developer.",
  },
];

export default function TestimonialsSection() {
  const items = [...testimonials, ...testimonials];

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-page py-20 md:py-28"
    >
      <Container>
        {/* ── Heading ── */}
        <div className="relative z-10 mb-14 text-center">
          {/* eyebrow */}
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">
            Reviews
          </p>

          {/* Main heading — matches "Alter your Ideas Into Reality" style */}
          <h2 className="font-extrabold leading-tight text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Cerita dari tim yang{" "}
            <span className="text-accent">membangun</span>
            <br className="hidden sm:block" /> form lebih cepat.
          </h2>

          {/* sub-description */}
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
            Kartu bergerak otomatis, jadi kamu bisa melihat feedback tanpa scroll
            panjang.
          </p>
        </div>

        {/* ── Marquee carousel ── */}
        <div className="overflow-hidden">
          <div className="relative">
            <div className="group">
              <div
                className="flex w-max gap-6 py-4"
                style={{
                  animation: "marquee 38s linear infinite",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.animationPlayState =
                    "paused")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.animationPlayState =
                    "running")
                }
              >
                {items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    aria-hidden={index >= testimonials.length}
                    className="flex min-w-[260px] max-w-[280px] flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1"
                  >
                    {/* quote */}
                      <p className="text-sm leading-6 text-ink-muted">
                        &ldquo;{item.quote}&rdquo;
                      </p>

                    {/* author */}
                    <div className="flex items-center gap-3">
                      {/* avatar placeholder with brand color */}
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: "var(--accent-700)" }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {item.name}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* marquee keyframes */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
