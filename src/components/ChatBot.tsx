import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQ_DATA = [
  { q: "Qu'est-ce que AssurDignité ?", a: "**AssurDignité** est un produit d'assurance obsèques proposé par **SONAM VIE**. Il offre une couverture en cas de décès, avec **70% des prestations en nature** (cercueil, transport, inhumation…) et **30% en espèces**, versés en moins de 12 heures.", keywords: ['assurdignité', 'produit', 'quoi', 'définition'] },
  { q: "Quelles sont les formules disponibles ?", a: "4 formules sont disponibles :\n\n• **Formule A – Dignité Simple** : 1 500 000 FCFA\n• **Formule B – Serein** : 2 000 000 FCFA\n• **Formule C – Prestige** : 3 000 000 FCFA\n• **Formule D – Excellence** : 5 000 000 FCFA\n\nChaque formule couvre l'assuré principal, son conjoint, jusqu'à 4 enfants et 2 ascendants.", keywords: ['formule', 'formules', 'option', 'choix', 'a', 'b', 'c', 'd'] },
  { q: "Combien coûte la Formule A ?", a: "La **Formule A – Dignité Simple** garantit un capital de **1 500 000 FCFA** pour l'assuré principal. Le montant de la prime dépend de l'âge de chaque assuré. Utilisez notre **simulateur** pour un devis personnalisé.", keywords: ['formule a', 'dignité simple', 'coût a', 'prix a'] },
  { q: "Combien coûte la Formule B ?", a: "La **Formule B – Serein** garantit un capital de **2 000 000 FCFA** pour l'assuré principal et conjoint. La prime est calculée selon l'âge via la table actuarielle **CIMA H**.", keywords: ['formule b', 'serein', 'coût b', 'prix b'] },
  { q: "Combien coûte la Formule C ?", a: "La **Formule C – Prestige** offre un capital de **3 000 000 FCFA**. Elle est idéale pour une couverture intermédiaire élevée.", keywords: ['formule c', 'prestige', 'coût c', 'prix c'] },
  { q: "Combien coûte la Formule D ?", a: "La **Formule D – Excellence** est notre formule premium avec un capital de **5 000 000 FCFA** pour l'assuré principal et conjoint, **500 000 FCFA** par enfant et **3 500 000 FCFA** par ascendant.", keywords: ['formule d', 'excellence', 'coût d', 'prix d', 'premium'] },
  { q: "Comment souscrire ?", a: "Pour souscrire à AssurDignité :\n\n1. **Simulez** votre prime en ligne\n2. **Choisissez** votre formule\n3. **Remplissez** le formulaire d'adhésion (14 étapes)\n4. **Payez** via Mobile Money ou virement bancaire\n5. **Recevez** votre attestation immédiatement", keywords: ['souscrire', 'adhésion', 'inscrire', 'inscription', 'comment', 'processus'] },
  { q: "Qu'est-ce que le Bonus Fidélité-Santé 30% ?", a: "Si **aucun sinistre** n'est déclaré pendant **3 ans consécutifs**, vous recevez un bonus de **30% de vos primes nettes cumulées**. Ce bonus est versé sur votre compte Mobile Money ou bancaire.", keywords: ['bonus', 'fidélité', 'santé', '30%', 'récompense', 'fidélité-santé'] },
  { q: "Comment déclarer un sinistre ?", a: "Via votre **Espace Client**, section **Sinistre Fast-Track** :\n\n1. Remplissez le formulaire en **moins de 5 minutes**\n2. Uploadez les pièces justificatives\n3. Suivez l'avancement en temps réel\n4. Le capital espèces est versé en **moins de 12 heures**", keywords: ['sinistre', 'déclarer', 'déclaration', 'décès', 'fast-track'] },
  { q: "Qui peut être assuré ?", a: "Les conditions d'âge sont :\n\n• **Assuré principal** : jusqu'à 64 ans\n• **Conjoint(e)** : jusqu'à 64 ans\n• **Enfants** : jusqu'à 21 ans (nés ou à naître)\n• **Ascendants** : jusqu'à 79 ans (père, mère, oncle, tante)", keywords: ['âge', 'éligible', 'éligibilité', 'assuré', 'condition', 'enfant', 'ascendant', 'conjoint'] },
  { q: "Comment vous contacter ?", a: "📞 **27 20 31 71 82** / **05 95 45 21 65**\n📧 servicecommercialsonamvie@sonam.ci\n\nNotre équipe est disponible du lundi au vendredi, 8h-17h.", keywords: ['contact', 'contacter', 'téléphone', 'email', 'joindre', 'appeler'] },
  { q: "Quels sont les modes de paiement ?", a: "Nous acceptons :\n\n• **Wave** – Mobile Money\n• **Orange Money** – Mobile Money\n• **Moov Money** – Mobile Money\n• **MTN Money** – Mobile Money\n• **Virement bancaire** – joindre votre RIB\n\nLe paiement est **annuel**.", keywords: ['paiement', 'payer', 'mobile money', 'wave', 'orange', 'mtn', 'moov', 'virement', 'bancaire'] },
  { q: "Que couvrent les prestations en nature ?", a: "Les prestations en nature représentent **70% du capital** et comprennent :\n\n• Cercueil extérieur\n• Conservation du corps\n• Transport funéraire\n• Cérémonie d'inhumation\n• Rapatriement (selon formule)\n• Accompagnement funéraire complet", keywords: ['nature', 'prestation', 'cercueil', 'transport', 'inhumation', 'funéraire', '70%'] },
  { q: "Quels documents sont nécessaires ?", a: "Pour l'adhésion :\n\n• Pièce d'identité (CNI, passeport)\n• Photo d'identité\n• Acte de mariage (si conjoint assuré)\n• Actes de naissance des enfants\n\nPour un sinistre :\n• Acte de décès\n• Certificat médical\n• Pièce d'identité du bénéficiaire", keywords: ['document', 'pièce', 'justificatif', 'identité', 'nécessaire', 'fournir'] },
  { q: "Comment fonctionne le rapatriement ?", a: "Selon la formule choisie, le rapatriement du corps est inclus dans les prestations en nature. Il couvre le transport du corps du lieu de décès au lieu d'inhumation choisi par la famille.", keywords: ['rapatriement', 'transport', 'corps'] },
  { q: "Qu'est-ce que la table CIMA H ?", a: "La **table CIMA H** est la table de mortalité réglementaire utilisée dans la zone CIMA (Conférence Interafricaine des Marchés d'Assurances). Elle sert de base au calcul actuariel des primes d'assurance vie.", keywords: ['cima', 'table', 'actuariel', 'mortalité', 'calcul'] },
  { q: "Peut-on ajouter des enfants à naître ?", a: "Oui, les **enfants à naître** peuvent être déclarés lors de l'adhésion dans la section **Ayants-droits non assurés**. Ils seront couverts dès la naissance sans supplément de prime.", keywords: ['enfant', 'naître', 'naissance', 'futur', 'enceinte'] },
  { q: "Quelle est la durée du contrat ?", a: "Le contrat AssurDignité est renouvelable **annuellement**. Il est reconduit tacitement chaque année sous réserve du paiement de la prime. Vous pouvez résilier à tout moment.", keywords: ['durée', 'contrat', 'annuel', 'renouvellement', 'résiliation'] },
  { q: "Puis-je modifier ma formule ?", a: "Oui, vous pouvez **passer à une formule supérieure** à chaque renouvellement annuel. Le changement prendra effet à la prochaine date d'anniversaire du contrat.", keywords: ['modifier', 'changer', 'formule', 'upgrade', 'supérieure'] },
];

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

function findAnswer(question: string): string {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  let bestMatch = { score: 0, answer: '' };
  
  for (const faq of FAQ_DATA) {
    let score = 0;
    for (const kw of faq.keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (q.includes(normalizedKw)) {
        score += normalizedKw.length;
      }
    }
    const qWords = faq.q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    for (const w of qWords) {
      if (w.length > 3 && q.includes(w)) score += 2;
    }
    if (score > bestMatch.score) {
      bestMatch = { score, answer: faq.a };
    }
  }
  
  if (bestMatch.score >= 4) return bestMatch.answer;
  
  if (q.includes('prix') || q.includes('tarif') || q.includes('combien') || q.includes('prime') || q.includes('cout')) {
    return "Le montant de votre prime dépend de votre âge, de la formule choisie et de la composition familiale. Utilisez notre **simulateur de prime** pour obtenir un devis personnalisé en quelques clics !";
  }
  
  return "Merci pour votre question ! Je n'ai pas trouvé de réponse précise. Pour une aide personnalisée :\n\n📞 **27 20 31 71 82** / **05 95 45 21 65**\n📧 servicecommercialsonamvie@sonam.ci\n\nOu essayez une de ces questions : formules, bonus fidélité, paiement, sinistre, documents nécessaires.";
}

function formatMessage(text: string): JSX.Element {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, lineIdx) => {
        if (lineIdx > 0) {
          // Check for list items
          if (line.startsWith('• ') || line.startsWith('- ')) {
            const content = line.slice(2);
            return <span key={lineIdx}><br /><span className="pl-2">• {renderBold(content)}</span></span>;
          }
          if (/^\d+\.\s/.test(line)) {
            return <span key={lineIdx}><br /><span className="pl-2">{renderBold(line)}</span></span>;
          }
        }
        return <span key={lineIdx}>{lineIdx > 0 && <br />}{renderBold(line)}</span>;
      })}
    </span>
  );
}

function renderBold(text: string): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Bonjour ! 👋 Je suis l'assistant virtuel **AssurDignité**. Comment puis-je vous aider ?", isBot: true, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim()) return;
    const userMsg: Message = { id: Date.now(), text: msgText, isBot: false, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const answer = findAnswer(msgText);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: answer, isBot: true, timestamp: new Date() }]);
    }, 500);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[520px] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden"
          >
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
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isBot ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {formatMessage(msg.text)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['Quelles formules ?', 'Comment souscrire ?', 'Bonus Fidélité', 'Modes de paiement', 'Contact'].map(s => (
                  <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" onClick={() => sendMessage()} className="rounded-full shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
