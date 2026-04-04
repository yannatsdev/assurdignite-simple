import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Mon Profil</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5" /> Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nom</Label><Input defaultValue="Kouamé" /></div>
              <div><Label>Prénom</Label><Input defaultValue="Yao" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" defaultValue="yao.kouame@email.com" /></div>
            <div><Label>Téléphone</Label><Input defaultValue="05 55 12 34 56" /></div>
            <div><Label>Date de naissance</Label><Input type="date" defaultValue="1985-03-15" /></div>
            <Button className="w-full">Mettre à jour</Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['Email', 'SMS', 'WhatsApp'].map(ch => (
                <div key={ch} className="flex items-center justify-between">
                  <span className="text-sm">{ch}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Shield className="w-5 h-5" /> Sécurité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Changer le mot de passe</Button>
              <Button variant="outline" className="w-full">Activer l'authentification OTP</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
