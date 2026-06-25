
CREATE TABLE public.telemetry_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.telemetry_events TO authenticated;
GRANT ALL ON public.telemetry_events TO service_role;

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telemetry_insert_own"
  ON public.telemetry_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "telemetry_select_own"
  ON public.telemetry_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "telemetry_admin_select_all"
  ON public.telemetry_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX telemetry_events_created_at_idx ON public.telemetry_events (created_at DESC);
CREATE INDEX telemetry_events_name_idx ON public.telemetry_events (name);
