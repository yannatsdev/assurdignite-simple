import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAuthenticatorAvailable, registerPasskey, hasLocalPasskey } from "@/lib/webauthn";
import { useToast } from "@/hooks/use-toast";

const SESSION_FLAG = "passkey_prompt_dismissed_session";

export function PasskeyEnrollPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    if (hasLocalPasskey(user.id)) return;
    // Track logins count to only prompt on 2nd connection
    const key = `login_count_${user.id}`;
    const count = parseInt(localStorage.getItem(key) || "0", 10) + 1;
    localStorage.setItem(key, String(count));
    if (count < 2) return;

    isPlatformAuthenticatorAvailable().then((ok) => {
      if (ok) setOpen(true);
    });
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(false);
  };

  const enroll = async () => {
    setLoading(true);
    const r = await registerPasskey();
    setLoading(false);
    if (r.ok) {
      toast({ title: "Empreinte activée", description: "Vous pourrez désormais vous connecter avec votre empreinte." });
      setOpen(false);
    } else {
      toast({ title: "Erreur", description: r.error || "Impossible d'activer", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <button onClick={dismiss} className="absolute right-3 top-3 z-10 p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
          <div className="bg-gradient-to-br from-primary via-primary/90 to-[hsl(var(--sonam-blue))] p-8 text-white text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
            >
              <Fingerprint className="w-10 h-10" />
            </motion.div>
            <h2 className="text-xl font-display font-bold">Connexion plus rapide</h2>
            <p className="text-sm text-white/80 mt-2">
              Activez la connexion par empreinte digitale ou Face ID pour accéder à votre espace en un instant.
            </p>
          </div>
          <div className="p-6 space-y-3 bg-background">
            <Button onClick={enroll} disabled={loading} className="w-full gap-2">
              <Fingerprint className="w-4 h-4" /> {loading ? "Activation…" : "Activer maintenant"}
            </Button>
            <Button variant="ghost" onClick={dismiss} className="w-full">Plus tard</Button>
            <p className="text-xs text-muted-foreground text-center">
              Sécurisé par votre appareil. Aucune donnée biométrique n'est transmise.
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
