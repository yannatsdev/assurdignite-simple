import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Bell, Search, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const [dark, setDark] = useState(true);
  const { signOut, user } = useAuth();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 ml-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Recherche globale..." className="bg-transparent border-none outline-none text-sm w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="icon" onClick={toggleDark}>{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>
              <Button variant="ghost" size="icon" className="relative"><Bell className="w-4 h-4" /><span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" /></Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Déconnexion</span></Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto bg-muted/30"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
