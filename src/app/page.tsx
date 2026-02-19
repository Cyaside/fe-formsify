import AboutSection from "@/components/sections/landing/AboutSection";
import ContactSection from "@/components/sections/landing/ContactSection";
import HeroSection from "@/components/sections/landing/HeroSection";
import StepsSection from "@/components/sections/landing/StepsSection";
import TestimonialsSection from "@/components/sections/landing/TestimonialsSection";

export default function Home() {
  return (
    <div className="bg-page text-ink">
      <HeroSection />
      <AboutSection />
      <StepsSection />
      <TestimonialsSection />
      <ContactSection />
    </div>
  );
}
