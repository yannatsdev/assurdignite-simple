import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">{title}</h1>
      <Card><CardContent className="pt-6 text-center py-20 text-muted-foreground">
        <p className="text-lg">Module {title} — Prêt à être connecté aux données Lovable Cloud</p>
      </CardContent></Card>
    </div>
  );
}
