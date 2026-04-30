import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable';
import { authenticateWithPasskey, isPlatformAuthenticatorAvailable, hasLocalPasskey } from '@/lib/webauthn';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';
import loginImg from '@/assets/login-client.jpg';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then((ok) => {
      setBiometricAvailable(ok && hasLocalPasskey());
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: 'Inscription réussie', description: 'Vérifiez votre email pour confirmer votre compte.' });
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/client');
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message || 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/client' });
      if (result.error) throw result.error;
      if (!result.redirected) navigate('/client');
    } catch (err: any) {
      toast({ title: 'Erreur Google', description: err.message || 'Connexion impossible', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const [bioFailed, setBioFailed] = useState(false);

  const handleBiometric = async () => {
    if (!email) {
      toast({ title: 'Email requis', description: 'Saisissez d\'abord votre email.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setBioFailed(false);
    const r = await authenticateWithPasskey(email);
    setIsLoading(false);
    if (r.ok) {
      navigate('/client');
    } else {
      setBioFailed(true);
      const msg = r.error || '';
      const friendly = /NotAllowed|cancelled|annul/i.test(msg)
        ? "Authentification annulée ou expirée. Réessayez ou utilisez Google."
        : /InvalidState|UNKNOWN_DEVICE|reconnu/i.test(msg)
        ? "Cet appareil n'est pas reconnu. Connectez-vous avec Google ou par email."
        : msg || 'Échec de la vérification.';
      toast({ title: 'Empreinte refusée', description: friendly, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero image */}
      <div className="relative overflow-hidden lg:w-1/2 h-48 sm:h-64 lg:h-auto">
        <img src={loginImg} alt="Famille africaine protégée" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-[hsl(var(--sonam-blue))]/70" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display mb-3 lg:mb-4 leading-tight">
              Bienvenue sur votre<br />Espace Client
            </h2>
            <p className="text-white/85 text-sm lg:text-base max-w-md">
              Gérez vos contrats, suivez vos paiements et déclarez vos sinistres en toute simplicité, 100% digital.
            </p>
            <div className="hidden lg:flex items-center gap-4 mt-6 text-xs text-white/80">
              <div className="flex items-center gap-1.5">+50 ans d'expérience</div>
              <div className="flex items-center gap-1.5">Capital garanti</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-7">
          <div className="flex items-center gap-3">
            <img src={logoSonam} alt="SONAM VIE" className="h-10" />
            <div className="w-px h-8 bg-border" />
            <img src={logoAssurDignite} alt="AssurDignité" className="h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">{isSignUp ? 'Créer un compte' : 'Bon retour parmi nous'}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{isSignUp ? 'Rejoignez la famille AssurDignité.' : 'Connectez-vous à votre espace sécurisé.'}</p>
          </div>

          {/* Biometric quick login */}
          {biometricAvailable && !isSignUp && (
            <motion.button
              type="button"
              onClick={handleBiometric}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--sonam-blue))] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Fingerprint className="w-6 h-6" />
              <span className="font-medium">Connexion par empreinte</span>
            </motion.button>
          )}

          {bioFailed && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground space-y-2">
              <p>L'empreinte n'a pas fonctionné. Essayez avec Google :</p>
              <Button type="button" size="sm" variant="outline" onClick={handleGoogle} disabled={isLoading} className="w-full gap-2">
                Continuer avec Google
              </Button>
            </motion.div>
          )}

          {/* Google */}
          <Button type="button" variant="outline" onClick={handleGoogle} disabled={isLoading} className="w-full gap-3 h-11">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.98 10.98 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider">ou avec email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label className="text-xs">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Votre nom complet" className="pl-10 h-11" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="votre@email.com" className="pl-10 h-11" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                <button type="button" className="absolute right-3 top-3" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 h-11" disabled={isLoading}>
              {isLoading ? 'Chargement…' : isSignUp ? "S'inscrire" : 'Se connecter'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary font-medium hover:underline">
              {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
            </button>
            <p className="text-xs text-muted-foreground">
              <Link to="/admin/login" className="hover:underline">Accès administrateur</Link>
              {' • '}
              <Link to="/" className="hover:underline">Retour au site</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
