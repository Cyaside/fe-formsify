import AboutSection from "@/widgets/landing/AboutSection";
import ContactSection from "@/widgets/landing/ContactSection";
import HeroSection from "@/widgets/landing/HeroSection";
import LandingBackground from "@/widgets/landing/LandingBackground";
import StepsSection from "@/widgets/landing/StepsSection";
import TestimonialsSection from "@/widgets/landing/TestimonialsSection";
import Footer from "@/shared/ui/Footer";

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-page text-ink">
      <LandingBackground />
      <div className="relative z-10">
        <HeroSection />
        <AboutSection />
        <StepsSection />
        <TestimonialsSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
}
