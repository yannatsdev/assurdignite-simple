
# Plan — Parcours simplifié, observabilité & E2E

## 1. Parcours simplifié (5 étapes)
File: `src/pages/client/Adhesion.tsx` (+ small extracted components)

Collapse the current 14-step wizard into a linear 5-step flow:

```text
1. Simulation    →  2. Scan OCR + Identité   →  3. KYC + Bénéficiaires
                                                       ↓
                              5. Reçu & documents  ←  4. Conditions + Signature + Paiement
```

- Step 1 auto-skipped if `simResult` already present (arrival from landing simulator).
- Step 2 merges OCR scan and the identity form: extracted fields pre-fill the form inline; user only confirms.
- Step 3 merges KYC uploads (CNI verso, selfie, justificatif domicile) with beneficiary designation on a single scrollable screen, split into two collapsible cards.
- Step 4 stacks CG/CP acceptance, signature pad, and Mobile Money payment in one screen with progressive disclosure (payment button enabled only after signature).
- Step 5 = confirmation + immediate access to Reçu / Attestation / Police downloads.
- Persist wizard state in `sessionStorage` keyed by user id (already planned previously — confirm wired).
- After finalize → navigate to `/client/contrats/:id`, never to bare `/client`.

## 2. Barre de progression unifiée
New component: `src/components/adhesion/UnifiedProgressBar.tsx`

A single sticky bar (top on desktop, top-under-header on mobile) showing the 5 macro-steps + a sub-status line for the currently running async operation:

- OCR: `compressing` → `uploading` → `analyzing` → `done`
- KYC upload: per-file progress (recto, verso, selfie, domicile) with check marks
- Validation pre-signature: runs `validateBeforeFinalize`, shows missing items inline before enabling "Signer"

Driven by a tiny Zustand-style store (`src/stores/adhesion-progress.ts`) so OCR, KYC, and validation modules can publish status without prop-drilling.

## 3. Admin telemetry dashboard
New page: `src/pages/admin/Telemetrie.tsx` (route `/admin/telemetrie`, link in `AdminSidebar`)

Reads from existing `telemetry_events` table. Shows:

- KPI cards: total events 24h / 7j, global success rate, p95 duration
- Per-`name` table (e.g. `ocr.extract`, `pdf.recu`, `kyc.upload`): count, success %, avg ms, p95 ms, last error
- Time-series chart (Recharts) of latency p50/p95 per day
- Filters: date range (preset 24h/7j/30j + custom), `kind` (ocr/pdf/kyc/payment/adhesion), `user_id` (search by email via join with `profiles`)
- Errors panel: latest 50 failed events with `error_message`, expandable `meta`

No new SQL needed (table already exists with admin-read policy). Add an index in a small migration:
```sql
CREATE INDEX IF NOT EXISTS telemetry_events_kind_created_idx
  ON public.telemetry_events (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_events_user_created_idx
  ON public.telemetry_events (user_id, created_at DESC);
```

## 4. Mobile polish du parcours
- Sticky bottom action bar (Précédent / Suivant) on `<md` breakpoints in `Adhesion.tsx`.
- Skeletons (`@/components/ui/skeleton`) on OCR analyzing, PDF generation, payment polling — never blank screens.
- Short status toasts ("Pièce reconnue", "Paiement reçu", "Contrat actif") instead of long modals.
- Larger touch targets (min 44px), single-column forms, autofocus next field after OCR fill.
- Compress hero/marketing imagery on the wizard pages (lazy-load).

## 5. Tests end-to-end (Playwright)
Use existing Playwright config. New specs under `tests/e2e/`:

- `adhesion.spec.ts` — happy path: login → simulation → OCR (mock `kyc-ocr-extract` via route intercept returning fixture JSON) → KYC uploads (fixture images) → beneficiary → CG/CP → signature canvas draw → payment (mock Mobile Money callback) → contract active → download Reçu/Attestation/Police (assert PDF blob size > 0 and contains `%PDF`).
- `validation-gate.spec.ts` — try to finalize with missing beneficiary / unpaid status → assert button disabled, inline messages list missing items, click "Aller corriger" jumps to correct step.
- `pdf-signatures.spec.ts` — generate the 3 PDFs after a fixture contract, parse first page with `pdf-parse`, assert "Le souscripteur", subscriber name, and flat stamp label ("PAYÉ" / "CERTIFIÉ" / "SONAM VIE") are present and the round stamp markers are absent.
- `telemetry.spec.ts` — run OCR mock → query `telemetry_events` via admin login → assert row appears with `success=true` and `duration_ms>0`.

Add `npm run test:e2e` script + a tiny `tests/fixtures/` folder (sample CNI/selfie/justificatif placeholder PNGs, signature PNG, OCR JSON).

## 6. Technical notes
- No new third-party deps for the wizard or dashboard. Charts reuse existing `recharts` install.
- Telemetry already instrumented in `src/lib/telemetry.ts` and `IdCardScanner.tsx`; extend coverage to `BasicKyc.tsx` uploads, `Adhesion.tsx` finalize, and PDF generators in `Documents.tsx`.
- Keep `kyc-ocr-extract` on `google/gemini-2.5-flash` for speed (already set).
- All new SQL follows GRANT-then-RLS pattern (index migration only — no new tables).

## Out of scope
- Re-skinning landing page.
- Replacing the signature pad library.
- Native mobile packaging.
- Multi-language (UI stays FR).
