import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusPill } from '@/components/ui/status-pill';
import { DocumentPreviewDialog } from '@/components/documents/DocumentPreviewDialog';
import { ArrowLeft, FileText, Eye, Clock, CheckCircle2, AlertTriangle, Loader2, XCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STAGES = [
  { key: 'declared', label: 'Déclaré', icon: Clock },
  { key: 'processing', label: 'En traitement', icon: AlertTriangle },
  { key: 'paid', label: 'Payé', icon: CheckCircle2 },
];

const STATUS_LABEL: Record<string, string> = {
  declared: 'Déclaré',
  processing: 'En traitement',
  paid: 'Payé',
  rejected: 'Rejeté',
};

export default function SinistreSuivi() {
  const { id } = useParams();
  const { user } = useAuth();
  const [sinistre, setSinistre] = useState<any>(null);
  const [docs, setDocs] = useState<{ path: string; url: string; name: string; ext: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [docQ, setDocQ] = useState('');
  const [docSort, setDocSort] = useState<'name' | 'type'>('name');
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const loadDocs = async (paths: string[]) => {
    if (!paths?.length) { setDocs([]); return; }
    const signed = await Promise.all(paths.map(async (p) => {
      const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(p, 3600);
      const name = p.split('/').pop() || p;
      const ext = (name.split('.').pop() || '').toLowerCase();
      return { path: p, url: data?.signedUrl || '', name, ext };
    }));
    setDocs(signed.filter(d => d.url));
  };

  const filteredDocs = useMemo(() => {
    const q = docQ.trim().toLowerCase();
    const filtered = q ? docs.filter(d => d.name.toLowerCase().includes(q)) : docs;
    return [...filtered].sort((a, b) =>
      docSort === 'type' ? a.ext.localeCompare(b.ext) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)
    );
  }, [docs, docQ, docSort]);

  useEffect(() => {
    if (!id || !user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from('sinistres').select('*').eq('id', id).maybeSingle();
      if (!alive) return;
      setSinistre(data);
      setLoading(false);
      if (data?.documents_urls) loadDocs(data.documents_urls as string[]);
    })();

    const channel = supabase.channel(`sin-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sinistres', filter: `id=eq.${id}` }, (payload) => {
        const upd = payload.new as any;
        setSinistre(upd);
        if (upd?.documents_urls) loadDocs(upd.documents_urls);
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [id, user]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!sinistre) return <div className="text-center py-16 text-muted-foreground">Dossier introuvable.</div>;

  const isRejected = sinistre.status === 'rejected';
  const currentIdx = isRejected ? -1 : STAGES.findIndex(s => s.key === sinistre.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/client" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Suivi sinistre</h1>
            <p className="text-muted-foreground font-mono text-sm">{sinistre.reference}</p>
          </div>
          <StatusPill status={sinistre.status} size="md" />

        </div>
      </motion.div>

      {/* Stepper */}
      <Card><CardContent className="pt-6">
        {isRejected ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <XCircle className="w-8 h-8 text-destructive shrink-0" />
            <div>
              <p className="font-semibold">Dossier rejeté</p>
              <p className="text-sm text-muted-foreground">Contactez le service sinistres au 27 20 31 71 82.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s.key} className="flex items-center flex-1 min-w-[110px]">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <motion.div
                      animate={active ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${done ? 'bg-gradient-to-br from-primary to-[hsl(var(--sonam-blue))] text-white shadow-md' : 'bg-muted text-muted-foreground'}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className={`text-xs font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isRejected && sinistre.status !== 'paid' && (
          <div className="mt-5 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
            <span className="font-semibold text-primary">⏱ Délai estimé : </span>
            {sinistre.status === 'declared' ? 'Validation sous 2h ouvrées' : 'Versement sous 15 jours ouvrés après validation'}
          </div>
        )}
      </CardContent></Card>

      {/* Infos */}
      <Card><CardContent className="pt-6 space-y-2 text-sm">
        <h3 className="font-semibold font-display text-base mb-2">Informations</h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
          <div><span className="text-muted-foreground">Décédé :</span> <span className="font-medium">{sinistre.nom_decede}</span></div>
          <div><span className="text-muted-foreground">Date de décès :</span> {sinistre.date_deces || '—'}</div>
          <div><span className="text-muted-foreground">Lieu :</span> {sinistre.lieu_deces || '—'}</div>
          <div><span className="text-muted-foreground">Bénéficiaire :</span> {sinistre.beneficiaire_nom || '—'}</div>
          <div><span className="text-muted-foreground">Paiement :</span> <span className="capitalize">{sinistre.methode_paiement || '—'}</span></div>
          <div><span className="text-muted-foreground">N° :</span> {sinistre.numero_paiement || '—'}</div>
        </div>
        {sinistre.circonstances && <div className="pt-2 border-t mt-2"><span className="text-muted-foreground">Circonstances :</span> <p className="mt-1">{sinistre.circonstances}</p></div>}
      </CardContent></Card>

      {/* Documents */}
      <Card><CardContent className="pt-6 space-y-3">
        <h3 className="font-semibold font-display text-base">Pièces téléchargées ({docs.length})</h3>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={docQ} onChange={e => setDocQ(e.target.value)} placeholder="Rechercher une pièce…" className="pl-9" />
              </div>
              <Select value={docSort} onValueChange={(v: any) => setDocSort(v)}>
                <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom (A–Z)</SelectItem>
                  <SelectItem value="type">Type de fichier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ul className="space-y-2">
              {filteredDocs.map((d, i) => (
                <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{d.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.ext}</span>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setPreview(d)}>
                    <Eye className="w-3 h-3" /> Aperçu
                  </Button>
                </li>
              ))}
              {filteredDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat.</p>}
            </ul>
          </>
        )}
      </CardContent></Card>
      <DocumentPreviewDialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)} url={preview?.url || null} filename={preview?.name} />
    </div>
  );
}

