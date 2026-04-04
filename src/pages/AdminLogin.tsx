import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';
import loginImg from '@/assets/login-admin.jpg';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non trouvé');
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error("Accès refusé. Vous n'êtes pas administrateur.");
      }
      navigate('/admin');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/90 to-[#1B3A6B]/50" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-8 h-8" />
              <span className="text-lg font-medium">Back-office SONAM VIE</span>
            </div>
            <h2 className="text-4xl font-bold font-display mb-4">Espace Administration</h2>
            <p className="text-white/80 text-lg max-w-md">Gérez les contrats, les sinistres et le portefeuille AssurDignité.</p>
          </motion.div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <img src={logoSonam} alt="SONAM VIE" className="h-10" />
            <img src={logoAssurDignite} alt="AssurDignité" className="h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Connexion Admin</h1>
            <p className="text-muted-foreground mt-2">Accès réservé aux gestionnaires SONAM VIE</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label>Email professionnel</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="admin@sonamvie.ci" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-3" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
              {isLoading ? 'Vérification...' : 'Accéder au back-office'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            <a href="/login" className="hover:underline">Retour à l'espace client</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
