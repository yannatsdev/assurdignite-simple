import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';

const NAV_ITEMS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Nos Formules', href: '#formules' },
  { label: 'Simulateur', href: '#simulateur' },
  { label: 'Avantages', href: '#avantages' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 bg-background ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      {/* Top contact bar — centered on mobile with phone + email stacked */}
      <div className="bg-primary text-white text-xs sm:text-sm">
        <div className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-0 sm:h-9 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-0.5 sm:gap-3 text-center">
          <a href="tel:+2252720317182" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap font-medium">+225 27 20 31 71 82</span>
          </a>
          <a href="mailto:servicecommercialsonamvie@sonam.ci" className="flex items-center gap-1.5 hover:text-secondary transition-colors min-w-0">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[240px] sm:max-w-none">servicecommercialsonamvie@sonam.ci</span>
          </a>
          <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5" /> Plateau, Immeuble Trade Center 3ème étage
          </span>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between h-20 sm:h-24 gap-3">
          <a href="#accueil" className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="bg-white rounded-xl p-1.5 sm:p-2 shadow-sm border border-border/40 flex items-center gap-2 sm:gap-3">
              <img
                src={logoSonam}
                alt="SONAM VIE"
                className="h-11 sm:h-14 w-auto object-contain"
                width={140}
                height={56}
              />
              <div className="w-px h-8 sm:h-10 bg-border" />
              <img
                src={logoAssurDignite}
                alt="AssurDignité"
                className="h-9 sm:h-12 w-auto object-contain"
                width={120}
                height={48}
              />
            </div>
          </a>


          <nav className="hidden lg:flex items-center gap-7">
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} className="text-base font-semibold text-foreground transition-colors hover:text-primary">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}
              className="border-primary text-primary hover:bg-primary/10 font-semibold">
              Mon Espace
            </Button>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-secondary hover:bg-secondary/90 font-semibold">
              Souscrire
            </Button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden">
            {mobileOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-b border-border p-4 space-y-3">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} className="block py-2 text-foreground hover:text-primary font-semibold text-base" onClick={() => setMobileOpen(false)}>
              {item.label}
            </a>
          ))}
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/login')}>Mon Espace</Button>
            <Button size="sm" className="flex-1 bg-secondary" onClick={() => navigate('/login')}>Souscrire</Button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
