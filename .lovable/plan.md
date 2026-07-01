
# Plan — UX polish, flow simplification, staging & security hardening

## 1. Copy & greeting tweaks
- Replace "Bonjour" with "Salut" in client + admin greetings (`src/pages/client/Dashboard.tsx`, `src/layouts/AdminLayout.tsx`, `src/pages/admin/Dashboard.tsx`, any header components).
- Global search/replace "Complétez les 14 étapes pour souscrire à AssurDignité" → "Complétez quelques étapes pour souscrire à AssurDignité".

## 2. Adhesion flow — merge step 1 into step 2
In `src/pages/client/Adhesion.tsx`:
- After simulation, land directly on a combined step that pre-fills principal info (nom, prénom, DOB, tel, email) alongside the simulation summary.
- Reduce macro steps from current set to **5**: Simulation+Infos → KYC/OCR → Bénéficiaires → Signature → Paiement → Confirmation (align `UnifiedProgressBar` MACRO array).

## 3. OCR reuse across KYC
In `src/components/kyc/IdCardScanner.tsx` and `src/components/kyc/BasicKyc.tsx`:
- Persist the OCR-captured CNI recto/verso images (upload to `kyc-documents` bucket immediately after successful scan) into an adhesion draft store.
- In `BasicKyc.tsx`, remove the CNI upload tiles. Keep only **Selfie** and **Justificatif de domicile**.
- Update the intro copy to reflect that the ID card is already captured.

## 4. OCR speed
`supabase/functions/kyc-ocr-extract/index.ts` + `IdCardScanner.tsx`:
- Lower client compression target (max 900px, quality 0.6) and skip re-compress if already <250KB.
- Reduce `max_tokens` to 250, drop `image2` when only one side scanned.
- Fire the warmup `ping` on component mount AND on simulation completion so the function is hot by the time the user reaches the scanner.
- Add a hard 8s timeout with a single silent retry.

## 5. Client design polish + responsiveness
- Tighten spacing/typography scale on mobile (`Dashboard.tsx`, `PolicyHeroCard.tsx`, `MarketingCarousel.tsx`).
- Ensure sticky bottom `StickyActionBar` clears iOS safe-area, and progress bar remains readable on 320px.
- Audit all `overflow-x` on horizontal cards, add `snap-x` where missing.

## 6. Draggable chatbot (also when minimized)
`src/components/ChatBot.tsx`:
- Add pointer-based drag handle for both the floating minimized bubble and the expanded panel header.
- Persist last position in `localStorage`, clamp to viewport, reset on resize.

## 7. Staging publish
- Run `security--get_scan_results` first; if clean, call `preview_ui--publish` (default Lovable slug remains, staging = current preview).

## 8. Fresh security scan
- `security--run_security_scan` after edits.
- Fix any new findings; do not touch existing ignored items.

## 9. E2E validation
- Execute `bunx playwright test tests/e2e/parcours-complet.spec.ts` in the sandbox against the live preview to confirm OCR→KYC→signature→PDF still passes.
- Fix selectors if the flow simplification broke them.

## 10. Logging & monitoring
- Extend `src/lib/telemetry.ts` with a `logError(scope, error, meta)` helper that writes to `telemetry_events` with `level='error'`.
- Wrap OCR, PDF generation, KYC upload, and payment finalization with try/catch → `logError`.
- Add a lightweight alert threshold view in `src/pages/admin/Telemetrie.tsx` (error rate > 10% in last hour → red banner).

## 11. Backend RLS & policy tests
- Add `tests/rls/rls.spec.ts` using the anon key to assert:
  - anon cannot select `kyc_documents.ocr_payload`
  - anon cannot insert into `notifications`
  - non-admin authenticated user cannot insert into `user_roles`
  - `has_role` not executable by anon
- Wire into `.github/workflows/e2e.yml` as a separate job.

## 12. Dependency vulnerability monitoring
- Add `.github/workflows/deps-audit.yml` running weekly + on PR: `bun audit --audit-level=medium` and `bunx osv-scanner --lockfile=bun.lockb`.
- Fail on high, warn on medium. Upload SARIF to GitHub code scanning.

## 13. Audit logging for KYC & notifications
Migration:
- Create `public.audit_log(id, user_id, action, table_name, row_id, meta jsonb, created_at)` with RLS: only admins read; service_role writes.
- Add triggers on `kyc_documents` (insert/update/select via a security-definer wrapper for reads is not feasible; instead log every UPDATE + service function reads) and `notifications` (INSERT/UPDATE/DELETE).
- Include grants as required.

## 14. Server-side admin authorization
- In every admin-only edge function (`admin-signup`, `admin-users`, any KYC review call), verify JWT → look up role via `has_role(uid,'admin')` → 403 otherwise.
- Add a shared `_shared/require-admin.ts` helper and use it consistently.
- Ensure client-side admin routes call these functions rather than mutating tables directly.

## Technical notes
- No schema breaking changes to existing tables besides adding `audit_log` and possibly `contracts.draft_kyc_recto_path` / `_verso_path` to persist pre-uploaded OCR images.
- All new tables get explicit `GRANT` + RLS per project convention.
- Confirm no regressions in `parcours-complet.spec.ts` after flow merge before publishing.

---

**Confirm to proceed** and I'll implement in this order: copy tweaks → flow merge → OCR reuse/speed → chatbot drag → design polish → migrations (audit log) → edge function auth → tests & CI → security scan → staging publish.
