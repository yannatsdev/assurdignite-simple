import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Loader2, Camera, Sparkles as SparkIcon, ScanLine } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { IdCardScanner, type OcrExtractedData } from '@/components/kyc/IdCardScanner';
import familyPro from '@/assets/banners/family-pro.jpg';

export default function ProfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const handleUpdate = async () => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth || null,
        id_document_type: profile.id_document_type || null,
        id_document_number: profile.id_document_number || null,
      } as any)
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Profil mis à jour ✓' });
  };

  const handlePasswordChange = async () => {
    if (newPwd.length < 6) {
      toast({ title: 'Mot de passe trop court', description: 'Minimum 6 caractères.', variant: 'destructive' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    setNewPwd('');
    setConfirmPwd('');
    toast({ title: 'Mot de passe mis à jour ✓' });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux (max 5 Mo)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (uploadErr) {
      toast({ title: 'Erreur upload', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path);
    const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('id', user.id);
    if (updateErr) {
      toast({ title: 'Erreur', description: updateErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
    toast({ title: 'Photo de profil mise à jour ✓' });
    setUploading(false);
  };

  const handleOcrExtracted = (data: OcrExtractedData) => {
    setProfile((p: any) => ({
      ...p,
      full_name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || p.full_name,
      date_of_birth: data.date_of_birth || p.date_of_birth,
      id_document_type: data.document_type || p.id_document_type,
      id_document_number: data.document_number || p.id_document_number,
    }));
    setShowScanner(false);
    toast({
      title: '✓ Informations pré-remplies',
      description: 'Vérifiez et cliquez sur "Mettre à jour" pour enregistrer.',
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero header with banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-44 sm:h-52 w-full overflow-hidden rounded-3xl shadow-lg"
      >
        <img src={familyPro} alt="" className="absolute inset-0 h-full w-full object-cover scale-110" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="relative z-10 h-full flex items-center gap-4 sm:gap-5 p-5 sm:p-7">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/40 flex items-center justify-center overflow-hidden shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow font-display">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div className="text-white min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/80 font-medium">Mon Profil</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display drop-shadow truncate">
              {profile?.full_name || 'Bienvenue'}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 truncate drop-shadow">{profile?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* OCR autofill block */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm sm:text-base flex items-center gap-2">
                  Remplissage automatique (OCR)
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                    <SparkIcon className="w-3 h-3" /> AI
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scannez votre CNI ou passeport — vos informations seront remplies automatiquement.
                </p>
              </div>
            </div>
            {!showScanner && (
              <Button
                size="sm"
                onClick={() => setShowScanner(true)}
                className="gap-1 bg-gradient-to-r from-primary to-secondary text-white shrink-0"
              >
                <Camera className="w-3.5 h-3.5" /> Scanner
              </Button>
            )}
          </div>
          <AnimatePresence>
            {showScanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <IdCardScanner onExtracted={handleOcrExtracted} className="border-0 bg-transparent p-0" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanner(false)}
                  className="mt-2"
                >
                  Fermer le scanner
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-primary" /> Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={profile?.email || ''} disabled />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={profile?.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={profile?.date_of_birth || ''}
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>N° pièce d'identité</Label>
                <Input
                  value={profile?.id_document_number || ''}
                  onChange={(e) => setProfile({ ...profile, id_document_number: e.target.value })}
                  placeholder="CNI / Passeport"
                />
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full bg-primary hover:bg-primary/90">
              Mettre à jour
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Email', 'SMS', 'WhatsApp'].map((ch) => (
                <div key={ch} className="flex items-center justify-between">
                  <span className="text-sm">{ch}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-primary" /> Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div>
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                className="w-full"
                disabled={pwdLoading || !newPwd || !confirmPwd}
              >
                {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Changer le mot de passe'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
