import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Notif = { id: string; title: string; message: string | null; type: string; link: string | null; read: boolean; created_at: string };

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (alive) setNotifs((data || []) as Notif[]);
    })();
    const ch = supabase.channel(`notif-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (p) => setNotifs(prev => [p.new as Notif, ...prev].slice(0, 50)))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [user]);

  const unread = notifs.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = async (n: Notif) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-destructive text-white text-[10px] flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="font-semibold font-display">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="w-3 h-3" /> Tout lu
            </button>
          )}
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full grid grid-cols-4 rounded-none">
            <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
            <TabsTrigger value="sinistre" className="text-xs">Sinistres</TabsTrigger>
            <TabsTrigger value="paiement" className="text-xs">Paiements</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="m-0 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Aucune notification</p>
            ) : (
              <ul className="divide-y">
                {filtered.map(n => (
                  <li key={n.id}>
                    <button onClick={() => handleClick(n)} className={`w-full text-left p-3 hover:bg-accent transition ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{n.title}</p>
                          {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
