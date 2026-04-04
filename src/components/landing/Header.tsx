import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Shield, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';

const NAV_ITEMS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Nos Formules', href: '#formules' },
  { label: 'Simulateur', href: '#simulateur' },
  { label: 'Avantages', href: '#avantages' },
  { label: 'Contact', href: '#contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-lg border-b border-border' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        {/* Logos */}
        <div className="flex items-center gap-3">
          <img src={logoSonam} alt="SONAM VIE" className="h-12 w-auto" />
          <div className="w-px h-8 bg-border" />
          <img src={logoAssurDignite} alt="AssurDignité" className="h-10 w-auto" />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} className={`text-sm font-medium transition-colors hover:text-primary ${scrolled ? 'text-foreground' : 'text-white'}`}>
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/login')} className={scrolled ? '' : 'border-white/30 text-white hover:bg-white/10'}>
            Espace Client
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/login')} className="bg-secondary hover:bg-secondary/90">
            Espace Admin
          </Button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden">
          {mobileOpen ? <X className={`w-6 h-6 ${scrolled ? 'text-foreground' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${scrolled ? 'text-foreground' : 'text-white'}`} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-b border-border p-4 space-y-3">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} className="block py-2 text-foreground hover:text-primary font-medium" onClick={() => setMobileOpen(false)}>
              {item.label}
            </a>
          ))}
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/login')}>Espace Client</Button>
            <Button size="sm" className="flex-1 bg-secondary" onClick={() => navigate('/admin/login')}>Admin</Button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
