import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Calculator, Search, Download } from 'lucide-react';
import { SimulateurSection } from '@/components/landing/SimulateurSection';

export default function AdminOutils() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Outils Avancés</h1>
        <p className="text-muted-foreground">Simulateur interne et recherche globale</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Calculator className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-bold font-display">Simulateur interne</p>
            <p className="text-xs text-muted-foreground mt-1">Calcul actuariel CIMA H</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Search className="w-10 h-10 text-secondary mx-auto mb-3" />
            <p className="font-bold font-display">Recherche globale</p>
            <p className="text-xs text-muted-foreground mt-1">Contrats, clients, sinistres</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Download className="w-10 h-10 text-sonam-gold mx-auto mb-3" />
            <p className="font-bold font-display">Export données</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, Excel, PDF</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-sm">Simulateur de prime interne</CardTitle></CardHeader>
        <CardContent>
          <SimulateurSection />
        </CardContent>
      </Card>
    </div>
  );
}
