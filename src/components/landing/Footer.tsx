import { Phone, Mail, Facebook, Linkedin, Twitter, MessageCircle, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';

export function Footer() {
  const { toast } = useToast();
  const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://assurdignite.sonam.ci';
  const shareText = 'Découvrez AssurDignité, l\'assurance obsèques digne par SONAM VIE';
  const shareLinks = [
    { Icon: Facebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}` },
    { Icon: Linkedin, label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}` },
    { Icon: Twitter, label: 'X / Twitter', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(shareText)}` },
    { Icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + SITE_URL)}` },
  ];
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(SITE_URL); toast({ title: 'Lien copié', description: SITE_URL }); }
    catch { toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' }); }
  };
  return (
    <footer className="bg-gradient-sonam text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="inline-flex items-center gap-3 mb-4 bg-white rounded-xl px-4 py-3 shadow-md">
              <img src={logoSonam} alt="SONAM VIE" className="h-12 w-auto object-contain" loading="eager" decoding="async" />
              <span className="h-10 w-px bg-border" aria-hidden />
              <img src={logoAssurDignite} alt="AssurDignité" className="h-10 w-auto object-contain" loading="eager" decoding="async" />
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
        <div className="border-t border-white/20 pt-6 mb-6">
          <p className="text-xs text-white/70 leading-relaxed max-w-4xl">
            Produit soumis au Code CIMA. <strong className="text-white">Porteur de risque :</strong> SONAM Vie. <strong className="text-white">Concepteur & architecte :</strong> AIF SARL. <strong className="text-white">Plateforme technologique :</strong> AssurDignité (ATS/AIF). Conditions détaillées : voir CG / CP SONAM Vie. Souscription soumise à acceptation. Données protégées et confidentialité garanties.
          </p>
        </div>
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/60">© {new Date().getFullYear()} SONAM VIE - AssurDignité. Tous droits réservés.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 mr-2 hidden sm:inline">Partager :</span>
            {shareLinks.map(({ Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Partager sur ${label}`}
                 className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
            <button onClick={copyLink} aria-label="Copier le lien"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Link2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
