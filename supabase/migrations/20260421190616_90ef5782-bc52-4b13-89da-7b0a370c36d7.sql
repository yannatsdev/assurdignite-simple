-- 1. Vider les données métier (RAZ)
TRUNCATE TABLE public.paiements, public.sinistres, public.beneficiaires, public.assures_complementaires, public.contracts CASCADE;

-- 2. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  contract_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Activer realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;