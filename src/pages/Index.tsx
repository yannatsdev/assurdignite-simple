import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FormulesSection } from '@/components/landing/FormulesSection';
import { SimulateurSection } from '@/components/landing/SimulateurSection';
import { AvantagesSection } from '@/components/landing/AvantagesSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { ChatBot } from '@/components/ChatBot';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FormulesSection />
      <SimulateurSection />
      <AvantagesSection />
      <ContactSection />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
