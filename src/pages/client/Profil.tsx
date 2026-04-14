import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Loader2, Camera } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ProfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Fichier trop volumineux (max 5 Mo)', variant: 'destructive' }); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (uploadErr) { toast({ title: 'Erreur upload', description: uploadErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path);
    const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('id', user.id);
    if (updateErr) { toast({ title: 'Erreur', description: updateErr.message, variant: 'destructive' }); setUploading(false); return; }
    setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
    toast({ title: 'Photo de profil mise à jour ✓' });
    setUploading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const initials = (profile?.full_name || profile?.email || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5" /> Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || 'Nom non défini'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

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
