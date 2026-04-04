import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: 'Inscription réussie', description: 'Vérifiez votre email pour confirmer votre compte.' });
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

  return (
    <div className="min-h-screen flex">
      {/* Left: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl font-bold font-display mb-4">Bienvenue sur votre Espace Client</h2>
            <p className="text-white/80 text-lg max-w-md">Gérez vos contrats, suivez vos paiements et déclarez vos sinistres en toute simplicité.</p>
          </motion.div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <img src={logoSonam} alt="SONAM VIE" className="h-10" />
            <img src={logoAssurDignite} alt="AssurDignité" className="h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">{isSignUp ? 'Créer un compte' : 'Connexion'}</h1>
            <p className="text-muted-foreground mt-2">{isSignUp ? 'Rejoignez la famille AssurDignité' : 'Accédez à votre espace AssurDignité'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Votre nom complet" className="pl-10" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="votre@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
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
              {isLoading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary font-medium hover:underline">
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Créer un compte'}
            </button>
            <p className="text-xs text-muted-foreground">
              <Link to="/admin/login" className="hover:underline">Accès administrateur</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
