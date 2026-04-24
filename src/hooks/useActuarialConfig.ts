import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useActuarialConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from('actuarial_config_versions' as any).select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (mounted) { setConfig((data as any)?.config_json || null); setLoading(false); }
    };
    load();
    const channel = supabase.channel('actuarial-config-live').on('postgres_changes', { event: '*', schema: 'public', table: 'actuarial_config_versions' }, load).subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);
  return { config, loading };
}
