import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Eye, Check, X, Loader2, FileText, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Doc = {
  id: string;
  user_id: string;
  contract_id: string | null;
  doc_type: string;
  storage_path: string;
  mime_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  ocr_payload: any;
  reject_reason: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
};

const DOC_LABEL: Record<string, string> = {
  cni_recto: "CNI (recto)",
  cni_verso: "CNI (verso)",
  passport: "Passeport",
  selfie: "Selfie",
  domicile: "Justif. domicile",
  autre: 'Autre',
};

export default function AdminKycDocuments() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected] = useState<Doc | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: 'Erreur de chargement', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    // Fetch profiles in batch
    const userIds = Array.from(new Set((data ?? []).map((d) => d.user_id)));
    let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      profilesMap = (profs ?? []).reduce<typeof profilesMap>((acc, p: any) => {
        acc[p.id] = { full_name: p.full_name, email: p.email };
        return acc;
      }, {});
    }
    setDocs(((data ?? []) as any[]).map((d) => ({ ...d, profile: profilesMap[d.user_id] })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openPreview = async (d: Doc) => {
    setSelected(d);
    setRejectReason(d.reject_reason ?? '');
    const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(d.storage_path, 300);
    if (error) {
      toast({ title: 'Aperçu indisponible', description: error.message, variant: 'destructive' });
      return;
    }
    setPreviewUrl(data.signedUrl);
  };

  const setStatus = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setActing(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('kyc_documents')
      .update({
        status,
        reject_reason: status === 'rejected' ? rejectReason || 'Non conforme' : null,
        reviewed_by: u.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selected.id);
    setActing(false);
    if (error) {
      toast({ title: 'Échec', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: status === 'approved' ? 'Document validé ✓' : 'Document rejeté' });
    setSelected(null);
    setPreviewUrl(null);
    load();
  };

  const filtered = docs.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.profile?.full_name?.toLowerCase().includes(s) ||
      d.profile?.email?.toLowerCase().includes(s) ||
      d.doc_type.toLowerCase().includes(s)
    );
  });

  const counts = {
    pending: docs.filter((d) => d.status === 'pending').length,
    approved: docs.filter((d) => d.status === 'approved').length,
    rejected: docs.filter((d) => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" /> KYC & Documents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pièces d'identité, selfies et justificatifs soumis par les souscripteurs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">En attente</div><div className="text-2xl font-bold text-amber-600">{counts.pending}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Validés</div><div className="text-2xl font-bold text-emerald-600">{counts.approved}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Rejetés</div><div className="text-2xl font-bold text-rose-600">{counts.rejected}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="w-4 h-4" /> Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Rechercher (nom, email, type)…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Validés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Aucun document.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((d) => (
                <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.profile?.full_name || d.profile?.email || d.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {DOC_LABEL[d.doc_type] || d.doc_type} · {format(new Date(d.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <Badge
                    variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {d.status === 'pending' ? 'En attente' : d.status === 'approved' ? 'Validé' : 'Rejeté'}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openPreview(d)} className="gap-1.5">
                    <Eye className="w-4 h-4" /> Voir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? DOC_LABEL[selected.doc_type] || selected.doc_type : ''}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm">
                <div><span className="text-muted-foreground">Utilisateur :</span> {selected.profile?.full_name || selected.profile?.email}</div>
                <div><span className="text-muted-foreground">Déposé le :</span> {format(new Date(selected.created_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>
              {previewUrl ? (
                selected.mime_type?.includes('pdf') ? (
                  <iframe src={previewUrl} className="w-full h-[500px] rounded-lg border" />
                ) : (
                  <img src={previewUrl} alt="" className="w-full max-h-[500px] object-contain rounded-lg border bg-muted" />
                )
              ) : (
                <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
              )}
              {selected.ocr_payload && (
                <details className="text-xs bg-muted/40 rounded p-2">
                  <summary className="cursor-pointer font-medium">Données OCR</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(selected.ocr_payload, null, 2)}</pre>
                </details>
              )}
              {selected.status !== 'approved' && (
                <Textarea
                  placeholder="Motif de rejet (si applicable)…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="destructive" disabled={acting} onClick={() => setStatus('rejected')} className="gap-1.5">
                  <X className="w-4 h-4" /> Rejeter
                </Button>
                <Button disabled={acting} onClick={() => setStatus('approved')} className="gap-1.5">
                  <Check className="w-4 h-4" /> Valider
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
