import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="relative z-40 border-t border-white/10 bg-surface py-8 text-xs text-ink">
      <Container className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span className="uppercase tracking-[0.3em] text-lavender font-semibold">Formsify</span>
        <span className="text-ink-muted">© 2026 Formsify. All rights reserved.</span>
      </Container>
    </footer>
  );
}
