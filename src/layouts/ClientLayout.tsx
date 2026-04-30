import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { Bell, Search, Moon, Sun, LogOut, LayoutDashboard, FileText, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatBot } from '@/components/ChatBot';
import { PasskeyEnrollPrompt } from '@/components/PasskeyEnrollPrompt';

const bottomNav = [
  { icon: LayoutDashboard, label: 'Accueil', path: '/client' },
  { icon: FileText, label: 'Contrats', path: '/client/contrats' },
  { icon: AlertTriangle, label: 'Sinistre', path: '/client/sinistre' },
  { icon: UserIcon, label: 'Profil', path: '/client/profil' },
];

export default function ClientLayout() {
  const [dark, setDark] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <ClientSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 px-3 sm:px-4 bg-card/80 backdrop-blur sticky top-0 z-30 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 ml-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Rechercher..." className="bg-transparent border-none outline-none text-sm w-48" />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[180px]">{user?.email}</span>
              <Button variant="ghost" size="icon" onClick={toggleDark}>{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>
              <Button variant="ghost" size="icon" className="relative"><Bell className="w-4 h-4" /><span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" /></Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Déconnexion</span></Button>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto bg-muted/30 min-w-0 pb-24 sm:pb-6">
            <Outlet />
          </main>

          {/* Mobile Bottom Nav */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border/60 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-4">
              {bottomNav.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${active ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                      <item.icon className="w-5 h-5" />
                      {active && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
      <ChatBot />
      <PasskeyEnrollPrompt />
    </SidebarProvider>
  );
}
