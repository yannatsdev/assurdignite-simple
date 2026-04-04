import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQ_DATA = [
  { q: "Qu'est-ce que AssurDignité ?", a: "**AssurDignité** est un produit d'assurance obsèques proposé par **SONAM VIE**. Il offre une couverture en cas de décès, avec **70% des prestations en nature** (cercueil, transport, inhumation…) et **30% en espèces**, versés en moins de 12 heures." },
  { q: "Quelles sont les formules disponibles ?", a: "4 formules sont disponibles :\n\n- **Formule A – Dignité Simple** : 1 500 000 FCFA\n- **Formule B – Serein** : 2 000 000 FCFA\n- **Formule C – Prestige** : 3 000 000 FCFA\n- **Formule D – Excellence** : 5 000 000 FCFA\n\nChaque formule couvre l'assuré principal, son conjoint, jusqu'à 4 enfants et 2 ascendants." },
  { q: "Comment souscrire ?", a: "Vous pouvez souscrire directement en ligne :\n\n1. Simulez votre prime\n2. Choisissez votre formule\n3. Remplissez le formulaire d'adhésion\n4. Payez via **Mobile Money** (Wave, Orange, Moov, MTN) ou par virement bancaire\n5. Recevez votre attestation immédiatement" },
  { q: "Qu'est-ce que le Bonus Fidélité-Santé 30% ?", a: "Si aucun sinistre n'est déclaré pendant **3 ans consécutifs**, vous recevez un bonus de **30% de vos primes cumulées**. C'est notre façon de récompenser votre fidélité !" },
  { q: "Comment déclarer un sinistre ?", a: "Via votre **Espace Client**, section **Sinistre Fast-Track** :\n\n1. Remplissez le formulaire en moins de 5 minutes\n2. Uploadez les pièces justificatives\n3. Suivez l'avancement en temps réel\n4. Le capital espèces est versé en **moins de 12 heures**" },
  { q: "Qui peut être assuré ?", a: "- **Assuré principal** : jusqu'à 64 ans\n- **Conjoint(e)** : jusqu'à 64 ans\n- **Enfants** : jusqu'à 21 ans (nés ou à naître)\n- **Ascendants** : jusqu'à 79 ans (père, mère, oncle, tante)" },
  { q: "Comment vous contacter ?", a: "📞 **27 20 31 71 82** / **05 95 45 21 65**\n📧 servicecommercialsonamvie@sonam.ci\n\nNotre équipe est disponible du lundi au vendredi, 8h-17h." },
];

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

function findAnswer(question: string): string {
  const q = question.toLowerCase();
  const match = FAQ_DATA.find(f => {
    const keywords = f.q.toLowerCase().split(/\s+/);
    return keywords.filter(k => k.length > 3).some(k => q.includes(k));
  });
  if (match) return match.a;
  if (q.includes('prix') || q.includes('tarif') || q.includes('combien') || q.includes('prime')) {
    return "Le montant de votre prime dépend de votre âge, de la formule choisie et de la composition familiale. Utilisez notre **simulateur de prime** pour obtenir un devis personnalisé en quelques clics !";
  }
  if (q.includes('paiement') || q.includes('payer') || q.includes('mobile money')) {
    return "Vous pouvez payer par **Mobile Money** (Wave, Orange Money, Moov Money, MTN Money) ou par **virement bancaire**. Le paiement est annuel.";
  }
  return "Merci pour votre question ! Pour une réponse personnalisée, contactez-nous :\n\n📞 **27 20 31 71 82** / **05 95 45 21 65**\n📧 servicecommercialsonamvie@sonam.ci";
}

function formatMessage(text: string): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part.split('\n').map((line, j) => (
          <span key={j}>{j > 0 && <br />}{line}</span>
        ))}</span>;
      })}
    </span>
  );
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Bonjour ! 👋 Je suis l'assistant virtuel **AssurDignité**. Comment puis-je vous aider ?", isBot: true, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, isBot: false, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const answer = findAnswer(input);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: answer, isBot: true, timestamp: new Date() }]);
    }, 600);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-sonam p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-sans">Assistant AssurDignité</p>
                  <p className="text-white/70 text-xs">En ligne • SONAM VIE</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isBot
                      ? 'bg-muted text-foreground rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {formatMessage(msg.text)}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['Quelles formules ?', 'Comment souscrire ?', 'Bonus Fidélité', 'Contact'].map(s => (
                  <button key={s} onClick={() => { setInput(s); }} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" onClick={sendMessage} className="rounded-full shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
