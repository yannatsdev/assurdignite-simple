import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bell, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminCommunication() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Contenus & Communication</h1>
        <p className="text-muted-foreground">Gestion des notifications et contenus FAQ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> FAQ du chatbot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              "Qu'est-ce que AssurDignité ?",
              "Quelles sont les formules disponibles ?",
              "Comment souscrire ?",
              "Comment déclarer un sinistre ?",
              "Qu'est-ce que le Bonus Fidélité ?",
            ].map((q, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm">{q}</span>
                <Badge variant="outline" className="text-xs">Actif</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
