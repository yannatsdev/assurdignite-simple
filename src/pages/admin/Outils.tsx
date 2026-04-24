import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, Calculator, Search, Download, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { SimulateurSection } from '@/components/landing/SimulateurSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const requiredFormules = ['A', 'B', 'C', 'D'];

function validateConfig(rows: any[]) {
  const errors: string[] = [];
  const formules: Record<string, any> = {};
  rows.forEach((row) => {
    const formule = String(row.formule || row.Formule || '').trim().toUpperCase();
    if (!formule) return;
    formules[formule] = {
      principal: Number(row.principal || row.Principal || row.capital_principal || 0),
      conjoint: Number(row.conjoint || row.Conjoint || row.capital_conjoint || 0),
      enfant: Number(row.enfant || row.Enfant || row.capital_enfant || 0),
      ascendant: Number(row.ascendant || row.Ascendant || row.capital_ascendant || 0),
    };
  });
  requiredFormules.forEach(f => {
    if (!formules[f]) errors.push(`Formule ${f} absente`);
    else Object.entries(formules[f]).forEach(([k, v]) => { if (!Number.isFinite(v) || Number(v) <= 0) errors.push(`Formule ${f}: ${k} invalide`); });
  });
  return { valid: errors.length === 0, errors, formules };
}

export default function AdminOutils() {
  const { user } = useAuth();
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const loadVersions = async () => {
    const { data } = await supabase.from('actuarial_config_versions' as any).select('*').order('created_at', { ascending: false });
    setVersions(data || []); setLoading(false);
  };
  useEffect(() => { loadVersions(); }, []);

  const handleFile = async (file?: File) => {
    if (!file || !user) return;
    if (!file.name.endsWith('.xlsx')) return toast.error('Format requis : fichier .xlsx');
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const first = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(first);
      const validation = validateConfig(rows as any[]);
      setReport(validation);
      if (!validation.valid) { setUploading(false); return toast.error('Fichier rejeté', { description: validation.errors[0] }); }
      const payload = {
        version_name: `Tarification ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        source_file_name: file.name,
        config_json: { options_capitals: validation.formules },
        validation_report: validation,
        is_active: true,
        created_by: user.id,
      };
      const { error } = await supabase.from('actuarial_config_versions' as any).insert(payload);
      if (error) throw error;
      toast.success('Configuration validée et activée');
      loadVersions();
    } catch (e: any) {
      toast.error('Import impossible', { description: e.message || 'Fichier invalide' });
    } finally { setUploading(false); }
  };

  const activate = async (id: string) => {
    const { error } = await supabase.from('actuarial_config_versions' as any).update({ is_active: true }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Version activée'); loadVersions(); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl sm:text-3xl font-bold font-display">Outils Avancés</h1><p className="text-muted-foreground">Simulateur interne, recherche globale et tarification dynamique</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><Calculator className="w-10 h-10 text-primary mx-auto mb-3" /><p className="font-bold font-display">Simulateur interne</p><p className="text-xs text-muted-foreground mt-1">Calcul actuariel contrôlé</p></CardContent></Card>
        <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><Search className="w-10 h-10 text-secondary mx-auto mb-3" /><p className="font-bold font-display">Recherche globale</p><p className="text-xs text-muted-foreground mt-1">Contrats, clients, sinistres</p></CardContent></Card>
        <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><Download className="w-10 h-10 text-sonam-gold mx-auto mb-3" /><p className="font-bold font-display">Export données</p><p className="text-xs text-muted-foreground mt-1">CSV, Excel, PDF</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Import Excel de tarification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border p-5 bg-muted/30 text-center">
            <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="font-medium">Uploader un fichier .xlsx validé</p>
            <p className="text-xs text-muted-foreground mb-3">Colonnes attendues : formule, principal, conjoint, enfant, ascendant.</p>
            <label><Input type="file" accept=".xlsx" className="max-w-sm mx-auto" disabled={uploading} onChange={e => handleFile(e.target.files?.[0])} /></label>
            {uploading && <p className="text-sm mt-3 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Validation...</p>}
          </div>
          {report && <div className={`p-3 rounded-lg border ${report.valid ? 'bg-secondary/10 border-secondary/30' : 'bg-destructive/10 border-destructive/30'}`}>{report.valid ? <p className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-secondary" /> Fichier validé : formules A/B/C/D détectées.</p> : <div className="space-y-1">{report.errors.map((e: string) => <p key={e} className="text-sm flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> {e}</p>)}</div>}</div>}
          <div className="overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Fichier</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow> : versions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune version importée</TableCell></TableRow> : versions.map(v => <TableRow key={v.id}><TableCell className="font-medium">{v.version_name}</TableCell><TableCell className="text-sm">{v.source_file_name || '—'}</TableCell><TableCell><Badge className={v.is_active ? 'bg-secondary' : ''}>{v.is_active ? 'Active' : 'Archivée'}</Badge></TableCell><TableCell className="text-sm">{new Date(v.created_at).toLocaleDateString('fr-FR')}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" disabled={v.is_active} onClick={() => activate(v.id)}>Activer</Button></TableCell></TableRow>)}</TableBody></Table>
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="font-display text-sm">Simulateur de prime interne</CardTitle></CardHeader><CardContent><SimulateurSection showActuarialBreakdown /></CardContent></Card>
    </div>
  );
}
