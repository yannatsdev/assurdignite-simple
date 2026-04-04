import { Phone, Mail, Facebook, Linkedin, Instagram } from 'lucide-react';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';

export function Footer() {
  return (
    <footer className="bg-gradient-sonam text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoSonam} alt="SONAM VIE" className="h-10 object-contain" />
              <img src={logoAssurDignite} alt="AssurDignité" className="h-8 object-contain" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">AssurDignité est un produit d'assurance obsèques de SONAM VIE, offrant une couverture complète pour protéger votre famille dans les moments difficiles.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-display">Produit</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#formules" className="hover:text-white transition-colors">Nos Formules</a></li>
              <li><a href="#simulateur" className="hover:text-white transition-colors">Simulateur</a></li>
              <li><a href="#avantages" className="hover:text-white transition-colors">Avantages</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conditions Générales</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-display">Espaces</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="/login" className="hover:text-white transition-colors">Espace Client</a></li>
              <li><a href="/admin/login" className="hover:text-white transition-colors">Espace Admin</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-display">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> 27 20 31 71 82</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> 05 95 45 21 65</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /><span className="break-all">servicecommercialsonamvie@sonam.ci</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/60">© {new Date().getFullYear()} SONAM VIE - AssurDignité. Tous droits réservés.</p>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><Linkedin className="w-4 h-4" /></a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><Instagram className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
