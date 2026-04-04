import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ProfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user]);

  const handleUpdate = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name, phone: profile.phone }).eq('id', user.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Profil mis à jour' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5" /> Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nom complet</Label><Input value={profile?.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={profile?.email || ''} disabled /></div>
            <div><Label>Téléphone</Label><Input value={profile?.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
            <Button onClick={handleUpdate} className="w-full">Mettre à jour</Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['Email', 'SMS', 'WhatsApp'].map(ch => (
                <div key={ch} className="flex items-center justify-between">
                  <span className="text-sm">{ch}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Shield className="w-5 h-5" /> Sécurité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Changer le mot de passe</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
