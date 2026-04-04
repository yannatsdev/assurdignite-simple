import { SimulateurSection } from '@/components/landing/SimulateurSection';

export default function SouscrirePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Souscrire</h1>
      <p className="text-muted-foreground">Commencez par simuler votre prime, puis procédez à l'adhésion.</p>
      <SimulateurSection />
    </div>
  );
}
