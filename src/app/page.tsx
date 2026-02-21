import AboutSection from "@/widgets/landing/AboutSection";
import ContactSection from "@/widgets/landing/ContactSection";
import HeroSection from "@/widgets/landing/HeroSection";
import StepsSection from "@/widgets/landing/StepsSection";
import TestimonialsSection from "@/widgets/landing/TestimonialsSection";
import Footer from "@/shared/ui/Footer";

export default function Home() {
  return (
    <div className="bg-page text-ink">
      <HeroSection />
      <AboutSection />
      <StepsSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
