CREATE INDEX IF NOT EXISTS telemetry_events_kind_created_idx ON public.telemetry_events (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_events_user_created_idx ON public.telemetry_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_events_name_created_idx ON public.telemetry_events (name, created_at DESC);