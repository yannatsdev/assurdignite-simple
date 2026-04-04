import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, Receipt } from 'lucide-react';

const documents = [
  { name: 'Police d\'assurance', type: 'PDF', icon: FileText, date: '15/06/2025' },
  { name: 'Conditions Générales', type: 'PDF', icon: BookOpen, date: '01/01/2026' },
  { name: 'Conditions Particulières', type: 'PDF', icon: BookOpen, date: '15/06/2025' },
  { name: 'Reçu de paiement 2025', type: 'PDF', icon: Receipt, date: '15/06/2025' },
  { name: 'Attestation d\'assurance', type: 'PDF', icon: FileText, date: '15/06/2025' },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Documents</h1>
      <div className="grid gap-3">
        {documents.map((doc, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <doc.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1"><Download className="w-4 h-4" /> Télécharger</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
