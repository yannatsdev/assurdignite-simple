// Lightweight, fire-and-forget telemetry helper.
// Records duration + success + error for client operations
// (OCR, PDF generation, KYC uploads). Never throws, never blocks UX.
import { supabase } from '@/integrations/supabase/client';

export type TelemetryKind = 'ocr' | 'pdf' | 'kyc' | 'payment' | 'adhesion';

interface TrackOpts {
  kind: TelemetryKind;
  name: string;
  meta?: Record<string, unknown>;
}

async function record(opts: TrackOpts & { duration_ms: number; success: boolean; error_message?: string }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('telemetry_events').insert({
      user_id: user?.id ?? null,
      kind: opts.kind,
      name: opts.name,
      duration_ms: Math.round(opts.duration_ms),
      success: opts.success,
      error_message: opts.error_message ?? null,
      meta: opts.meta ?? {},
    } as any);
  } catch {
    // swallow — telemetry must never break the app
  }
  // Always log to console for live debugging
  // eslint-disable-next-line no-console
  console.info(`[telemetry] ${opts.kind}:${opts.name}`, {
    duration_ms: Math.round(opts.duration_ms),
    success: opts.success,
    ...(opts.error_message ? { error: opts.error_message } : {}),
    ...(opts.meta || {}),
  });
}

/** Wrap an async function and record its outcome. Rethrows on error. */
export async function track<T>(opts: TrackOpts, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  try {
    const result = await fn();
    void record({ ...opts, duration_ms: performance.now() - t0, success: true });
    return result;
  } catch (e: any) {
    void record({
      ...opts,
      duration_ms: performance.now() - t0,
      success: false,
      error_message: (e?.message || String(e)).slice(0, 500),
    });
    throw e;
  }
}

/** Synchronous tracker (e.g. wrap PDF generation that is not async). */
export function trackSync<T>(opts: TrackOpts, fn: () => T): T {
  const t0 = performance.now();
  try {
    const result = fn();
    void record({ ...opts, duration_ms: performance.now() - t0, success: true });
    return result;
  } catch (e: any) {
    void record({
      ...opts,
      duration_ms: performance.now() - t0,
      success: false,
      error_message: (e?.message || String(e)).slice(0, 500),
    });
    throw e;
  }
}
