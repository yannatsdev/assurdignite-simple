import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Message envoyé !', description: 'Notre équipe vous répondra dans les plus brefs délais.' });
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section id="contact" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Contact</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 font-display">Parlons de votre protection</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Téléphone</h3>
                <p className="text-muted-foreground">27 20 31 71 82</p>
                <p className="text-muted-foreground">05 95 45 21 65</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">servicecommercialsonamvie@sonam.ci</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Siège Social</h3>
                <p className="text-muted-foreground">Abidjan, Côte d'Ivoire</p>
              </div>
            </div>
          </motion.div>

          <motion.form initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} onSubmit={handleSubmit} className="space-y-4 bg-card rounded-2xl p-8 shadow-lg border border-border">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder="Votre nom" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              <Input type="email" placeholder="Votre email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <Input placeholder="Votre téléphone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
            <Textarea placeholder="Votre message" rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} required />
            <Button type="submit" className="w-full gap-2"><Send className="w-4 h-4" /> Envoyer le message</Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
