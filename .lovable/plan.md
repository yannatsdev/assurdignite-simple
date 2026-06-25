# Plan — OCR, PDF, Subscription Guardrails & Observability

Most of the foundations from the previous turn are in place (signatures on PDFs, flat stamps, FR date format, compressed OCR payload). This plan closes the remaining gaps and tightens UX.

## 1. OCR — clear progress, faster capture, auto-retry
File: `src/components/kyc/IdCardScanner.tsx`

- Replace the single `scanning` boolean with a 4-state machine: `idle → compressing → uploading → analyzing → done|error`, surfaced via a `<Progress>` bar + status label ("Compression…", "Analyse IA…", "Extraction…").
- Auto-capture assist: detect when video frame is sharp+filled (basic luminance/edge heuristic on a downscaled canvas every 400 ms) and pulse a "Prêt à capturer" hint; user still confirms.
- Auto-retry: on OCR failure or empty extraction, retry once with higher quality (1600px / q 0.85) before showing the error. Show "Nouvelle tentative en cours…".
- Faster pipeline: kick off recto compression while user is still capturing verso (parallel preprocess); set explicit `signal: AbortController` so leaving the step cancels in-flight calls.
- Better mobile camera UX: when `getUserMedia` fails, fall back to the native camera input *and* surface a second button "Choisir depuis la galerie" (already added — verify both inputs are visible side-by-side on mobile, not stacked).

## 2. PDF templates — signature & date consistency
Files: `src/lib/pdf-shared.ts`, `src/pages/client/Documents.tsx`

- Add a single helper `pdfDocumentSignatures(doc, y, { subscriberSig, subscriberName, label })` that lays out two columns: left = "Le souscripteur" with signature image (or fallback line) + printed name, right = "SONAM VIE" with flat label (`PAYÉ` / `CERTIFIÉ` / `SONAM VIE`).
- Use this helper in receipt, attestation, and police generators so the layout is identical (same Y baseline, same 50×18 mm signature box, same caption).
- Scale signature images using `getImageProperties` to preserve aspect ratio inside the 50×18 box (no stretching on tall vs wide pads).
- Dates: introduce `formatDateFRLong` (e.g. "24 décembre 2026") for hero "Expiration" lines and keep `formatDateFR` (`24/12/2026`) for tables. Reserve enough width in the key/value grid (`colWidth` raised, `truncate` removed) so day digits never clip.

UI mirror: `src/components/client/PolicyHeroCard.tsx` already prints FR date — widen the Expiration card (`flex-1` → `min-w-[140px]`) and drop `truncate` on the date line so "24/12/2026" stays whole.

## 3. Subscription guardrails — no more dead-ends after signing
File: `src/pages/client/Adhesion.tsx` (+ small helper `src/lib/adhesion-validation.ts`)

- Add `validateBeforeFinalize(state)` returning a typed result `{ ok: true } | { ok: false, missing: string[], firstStep: number }` that checks: required profile fields, at least one beneficiary with 100 % share total, KYC docs (recto + selfie + domicile) marked `uploaded`, payment status === `paid`, signature data URL present.
- Block the "Finaliser" button when invalid, list missing items inline, and "Aller corriger" jumps back to the offending step instead of navigating to `/client`.
- After successful finalize, navigate to `/client/contrats/:id` (or `/client/documents`) — never to the bare dashboard — and toast "Contrat actif".
- Persist wizard state to `sessionStorage` keyed by user id, so an accidental reload resumes at the correct step instead of restarting.

## 4. Observability — error logs & perf metrics
New table + small client helper.

Migration: `telemetry_events` (`id`, `user_id`, `kind` text, `name` text, `duration_ms` int, `success` bool, `meta` jsonb, `created_at`) with RLS allowing `authenticated` insert-own and admin read. GRANTs as required.

Client helper `src/lib/telemetry.ts` exposing `track(name, fn)` (measures duration, captures error.message, inserts row best-effort, never throws). Instrument:
- `kyc-ocr-extract` invocation (success + duration + payload size)
- PDF generators (receipt / attestation / police): wrap `generate*` calls
- KYC document uploads in `BasicKyc.tsx`
- Edge function `kyc-ocr-extract`: add structured `console.log({ event, duration_ms, model, ok })` lines so they show up in edge-function logs.

Admin surface: a compact "Télémétrie" card on `src/pages/admin/Dashboard.tsx` showing 24 h counts and p95 duration per `name` (read-only query, no UI sprawl).

## 5. UX simplification — finish the 14→7 collapse
File: `src/pages/client/Adhesion.tsx`

Final step order:
1. Formule (skipped automatically when arriving with simulation state)
2. Identité + OCR (auto-fills 5 fields)
3. KYC (recto/verso/selfie/domicile in one screen, drag-drop + camera)
4. Bénéficiaires (single screen, inline add)
5. Signature
6. Paiement (Mobile Money)
7. Confirmation + téléchargements

- Inline validation per step (no blocking modal).
- Sticky bottom action bar on mobile with "Suivant" + progress dots.
- "Reprendre plus tard" button saves draft and emails resume link.

## Technical notes
- No new third-party deps.
- Lovable AI model stays `google/gemini-2.5-flash` for OCR (best speed/quality balance — already switched).
- All new SQL follows the GRANT-then-RLS pattern.
- Telemetry inserts are fire-and-forget (`.then().catch()`); never block UX.

## Out of scope
- Replacing the wizard library.
- Re-skinning the landing page.
- Mobile-app packaging.
