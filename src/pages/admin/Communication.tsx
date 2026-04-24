import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bell, Send, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

const blankFaq = { question: '', answer: '', category: 'Général', is_active: true, sort_order: 0 };

export default function AdminCommunication() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blankFaq);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.from('chatbot_faqs' as any).select('*').order('sort_order').order('created_at', { ascending: false });
    if (error) sonnerToast.error('FAQ indisponible', { description: error.message });
    setFaqs(data || []); setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase.channel('faqs-live').on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_faqs' }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const saveFaq = async () => {
    if (!form.question.trim() || !form.answer.trim()) return sonnerToast.error('Question et réponse requises');
    const payload = { ...form, question: form.question.trim(), answer: form.answer.trim(), sort_order: Number(form.sort_order) || 0 };
    const { error } = form.id ? await supabase.from('chatbot_faqs' as any).update(payload).eq('id', form.id) : await supabase.from('chatbot_faqs' as any).insert(payload);
    if (error) return sonnerToast.error('Enregistrement impossible', { description: error.message });
    setForm(blankFaq); sonnerToast.success('FAQ enregistrée'); load();
  };

  const toggleFaq = async (faq: any) => {
    const { error } = await supabase.from('chatbot_faqs' as any).update({ is_active: !faq.is_active }).eq('id', faq.id);
    if (error) sonnerToast.error(error.message); else sonnerToast.success(!faq.is_active ? 'FAQ activée' : 'FAQ désactivée');
  };
  const deleteFaq = async (id: string) => {
    const { error } = await supabase.from('chatbot_faqs' as any).delete().eq('id', id);
    if (error) sonnerToast.error(error.message); else sonnerToast.success('FAQ supprimée');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl sm:text-3xl font-bold font-display">Contenus & Communication</h1><p className="text-muted-foreground">Gestion des notifications et contenus FAQ</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Envoyer une notification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Titre</Label><Input placeholder="Titre de la notification" /></div>
            <div><Label>Message</Label><Textarea placeholder="Corps du message..." rows={4} /></div>
            <div><Label>Destinataires</Label><Input placeholder="Tous les clients" disabled /></div>
            <Button className="gap-2" onClick={() => toast({ title: 'Notification envoyée', description: 'La notification a été envoyée à tous les clients.' })}><Send className="w-4 h-4" /> Envoyer</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> {form.id ? 'Modifier une FAQ' : 'Ajouter une question'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label>Catégorie</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div><div><Label>Ordre</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div></div>
            <div><Label>Question</Label><Input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Ex: Comment déclarer un sinistre ?" /></div>
            <div><Label>Réponse</Label><Textarea rows={5} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Réponse officielle du chatbot..." /></div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><Label>Active dans le chatbot</Label><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
            <div className="flex gap-2"><Button onClick={saveFaq} className="gap-2"><Plus className="w-4 h-4" /> Enregistrer</Button>{form.id && <Button variant="outline" onClick={() => setForm(blankFaq)}>Annuler</Button>}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> FAQ du chatbot</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : faqs.length === 0 ? <p className="text-center text-muted-foreground py-10">Aucune FAQ. Ajoutez une première question.</p> : faqs.map(faq => (
            <div key={faq.id} className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-sm">{faq.question}</p><Badge variant="outline">{faq.category}</Badge><Badge className={faq.is_active ? 'bg-secondary' : 'bg-destructive'}>{faq.is_active ? 'Actif' : 'Inactif'}</Badge></div><p className="text-sm text-muted-foreground mt-1">{faq.answer}</p></div>
                <div className="flex gap-2 shrink-0"><Button size="sm" variant="outline" onClick={() => setForm(faq)}>Modifier</Button><Button size="sm" variant="outline" onClick={() => toggleFaq(faq)}>{faq.is_active ? 'Désactiver' : 'Activer'}</Button><Button size="icon" variant="destructive" onClick={() => deleteFaq(faq.id)}><Trash2 className="w-4 h-4" /></Button></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
