import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Download, Image as ImageIcon, ScanFace, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contract: any;
}

interface KycData {
  cni?: string;
  cniVerso?: string;
  photo?: string;
  domicile?: string;
  cniConjoint?: string;
  cniVersoConjoint?: string;
  photoConjoint?: string;
  livenessFrames?: string[];
  livenessFramesConjoint?: string[];
  docType?: string;
  livenessScore?: number;
  verifiedAt?: string;
  docTypeConjoint?: string;
  livenessScoreConjoint?: number;
}

const DOC_LABEL: Record<string, string> = {
  cni: "Carte d'identité nationale",
  passport: 'Passeport',
  permis: 'Permis de conduire',
  sejour: 'Permis de séjour',
};

export function KycViewerDialog({ open, onOpenChange, contract }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const kyc: KycData = (contract?.kyc_documents as KycData) || {};

  useEffect(() => {
    if (!open || !contract) return;
    const paths = [
      kyc.cni,
      kyc.cniVerso,
      kyc.photo,
      kyc.domicile,
      kyc.cniConjoint,
      kyc.cniVersoConjoint,
      kyc.photoConjoint,
      ...(kyc.livenessFrames || []),
      ...(kyc.livenessFramesConjoint || []),
    ].filter(Boolean) as string[];

    if (paths.length === 0) return;

    setLoading(true);
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        paths.map(async (p) => {
          const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(p, 600);
          if (data?.signedUrl) next[p] = data.signedUrl;
        }),
      );
      setUrls(next);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contract?.id]);

  const score = kyc.livenessScore;
  const scoreColor = score == null ? 'bg-muted' : score >= 0.8 ? 'bg-secondary' : 'bg-amber-500';

  const hasAny = Object.keys(kyc).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ShieldCheck className="w-5 h-5 text-primary" /> Documents KYC — {contract?.police_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-muted/40">
            <Info label="Assuré" value={contract?.principal_name || '—'} />
            <Info label="Type document" value={DOC_LABEL[kyc.docType || ''] || '—'} />
            <Info label="Vérifié le" value={kyc.verifiedAt ? new Date(kyc.verifiedAt).toLocaleString('fr-FR') : '—'} />
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Score de présence</p>
              <Badge className={`${scoreColor} text-white mt-1`}>
                {score != null ? `${(score * 100).toFixed(0)}%` : 'N/A'}
              </Badge>
            </div>
          </div>

          {!hasAny && (
            <div className="text-center py-12 text-muted-foreground">
              <ScanFace className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Aucun document KYC pour ce contrat.</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Principal */}
          {(kyc.cni || kyc.cniVerso || kyc.photo) && (
            <Section title="Assuré principal">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DocCard label="CNI — Recto" path={kyc.cni} url={kyc.cni && urls[kyc.cni]} />
                <DocCard label="CNI — Verso" path={kyc.cniVerso} url={kyc.cniVerso && urls[kyc.cniVerso]} />
                <DocCard label="Selfie" path={kyc.photo} url={kyc.photo && urls[kyc.photo]} />
              </div>
              {kyc.livenessFrames && kyc.livenessFrames.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                    Captures Liveness ({kyc.livenessFrames.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {kyc.livenessFrames.map((p) => (
                      <a key={p} href={urls[p]} target="_blank" rel="noreferrer" className="block w-20 h-24 rounded-lg overflow-hidden bg-muted">
                        {urls[p] && <img src={urls[p]} alt="frame" className="w-full h-full object-cover" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Conjoint */}
          {(kyc.cniConjoint || kyc.cniVersoConjoint || kyc.photoConjoint) && (
            <Section title="Conjoint">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DocCard label="CNI — Recto" path={kyc.cniConjoint} url={kyc.cniConjoint && urls[kyc.cniConjoint]} />
                <DocCard label="CNI — Verso" path={kyc.cniVersoConjoint} url={kyc.cniVersoConjoint && urls[kyc.cniVersoConjoint]} />
                <DocCard label="Selfie" path={kyc.photoConjoint} url={kyc.photoConjoint && urls[kyc.photoConjoint]} />
              </div>
            </Section>
          )}

          {kyc.domicile && (
            <Section title="Justificatif de domicile">
              <DocCard label="Document" path={kyc.domicile} url={urls[kyc.domicile]} />
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      {children}
    </div>
  );
}

function DocCard({ label, path, url }: { label: string; path?: string; url?: string | false }) {
  if (!path) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
        {label} — non fourni
      </div>
    );
  }
  const isPdf = path.toLowerCase().endsWith('.pdf');
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card group">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {url ? (
          isPdf ? (
            <iframe src={url as string} className="w-full h-full" title={label} />
          ) : (
            <img src={url as string} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          )
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        {url && (
          <a href={url as string} download target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
