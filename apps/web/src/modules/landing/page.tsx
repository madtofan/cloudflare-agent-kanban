import ContactSection from "./components/contact";
import HeroSection from "./components/hero";
import Footer from "./components/footer";
import FeaturesSection from "./components/features";

function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 sm:py-32">
        <HeroSection />
      </section>

      <section className="container mx-auto px-4 py-16">
        <FeaturesSection />
      </section>

      <section className="container mx-auto px-4 py-16">
        <ContactSection />
      </section>

      <Footer />
    </div >
  );
}

export default LandingPage;
