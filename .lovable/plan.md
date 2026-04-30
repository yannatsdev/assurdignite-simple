## Overview

Major upgrade across payments, KYC/OCR, simulators, dashboard polish, and full responsiveness. Includes 4 new SVG operator logos, an interactive premium "Wave-style" payment page, vision-OCR ID scanning, and a generated 3D African woman face image for the KYC scan animation.

---

## 1. New operator SVG logos

Copy the 4 uploaded SVGs to `src/assets/operators/`:
- `orange-money.svg` (from ORANGE-2.svg)
- `wave.svg` (from WAVE-2.svg)
- `mtn-momo.svg` (from MTN-2.svg)
- `moov-money.svg` (from MOOV-2.svg)

Update `src/components/payment/OperatorPicker.tsx` to import the new logos (replace the old basic ones).

---

## 2. Premium payment simulation page (Wave/CinetPay-inspired)

**New file: `src/pages/client/PaiementCheckoutV2.tsx`** (replaces `PaiementCheckout.tsx` route `/client/paiement`).

Layout inspired by uploaded screenshot:
- **Top blue gradient banner** with the amount in large bold + a small "(*) 1.5% de frais simulés ajoutés au montant. Mode test" footnote.
- **Tabs**: `Mobile Money` | `Cartes Bancaires` (disabled "Bientôt") | `Débit Direct` (disabled "Bientôt").
- **Operator carousel** (horizontal scroll on mobile, grid on desktop) with the 4 new circular SVG logos and ringed selection.
- Form: **Nom**, **Prénoms**, **Email**, **Compte Mobile Money** with country flag (+225 by default, switchable).
- Sticky bottom **"Payer X F CFA"** button (white text on violet gradient).
- After "Payer" → animated processing → OTP step (reuse `OtpVerification`) → biometric step (reuse logic) → success.

**New: `src/components/payment/PremiumPaymentBanner.tsx`** — animated promo banner shown above the form featuring a **generated AI image of an African family** (warm, smiling, wearing traditional clothes) with overlay text *"AssurDignité — La sérénité pour ceux que vous aimez"*, parallax glow, and a "simulation test" badge.

**New: `src/components/payment/SimulationBadge.tsx`** — floating ribbon "🧪 Mode simulation — aucun débit réel" pinned top-right of the page.

Update `src/App.tsx` to route `/client/paiement` and `/client/paiement/:contractId` to the new component.

---

## 3. Interactive premium simulator (3 versions)

**Shared new component: `src/components/simulator/PremiumSimulatorCore.tsx`** — encapsulates the inputs + premium results panel with:
- Animated big-number counter (count up via framer-motion) for the prime.
- **Comparative table** of the 4 formulas (A/B/C/D) showing for THE current family composition: prime annuelle, capital total, capital nature 70%, capital espèces 30%, with the selected one highlighted.
- **Recharts**: 
  - Donut chart Nature 70% / Espèces 30% (already exists).
  - **Stacked bar** comparing the 4 formulas' prime totals.
  - **Radar chart** showing coverage scope per formula (Cercueil, Conservation, Transport, Inhumation, Rapatriement) on a 1-5 scale.
- Premium "what's included" cards per formula with check icons.
- Animated "économie réalisée vs formule A" badge.

Apply this core to:
1. `src/components/landing/SimulateurSection.tsx` — landing.
2. `src/pages/client/Adhesion.tsx` step 0 (Simulation).
3. `src/pages/admin/Outils.tsx` admin simulator (find the existing one and replace, with the actuarial breakdown still shown for admins).

---

## 4. Family banners across the platform

**New: `src/components/marketing/FamilyBanner.tsx`** — reusable hero/promo banner with:
- Generated AI image of an African family (different variants: family of 4 smiling, elderly couple with grandchildren, mother with child, professional businesswoman with family).
- Overlay text customizable + CTA.
- Subtle parallax + fade-in animation (framer-motion).
- Variants: `hero`, `compact`, `wide`.

Generate **4 family images** via Lovable AI (`google/gemini-3-pro-image-preview`) and save to `src/assets/banners/`:
- `family-united.jpg` — happy African family of 4
- `family-elderly.jpg` — elderly couple with grandchildren
- `family-mother.jpg` — African mother holding child
- `family-pro.jpg` — African business professional with family

Place banners on:
- Client dashboard top (rotating subtle hero strip).
- Payment page (Section 2).
- Souscription completion screen.
- Landing simulator section background accent.

---

## 5. KYC OCR scanning (step 3 of adhesion)

**New: `src/components/kyc/IdCardScanner.tsx`** — alternative to (or complementary to) Didit:
- Camera capture of recto + verso of CNI/Passeport (using `getUserMedia` with `facingMode: 'environment'`).
- File upload fallback.
- After capture → calls new edge function `kyc-ocr-extract` with the base64 image.
- Loading state with the same scanning animation, then auto-fills `nom / prenom / dob / cni / adresse`.
- Inline preview with crop overlay.

**New edge function: `supabase/functions/kyc-ocr-extract/index.ts`**:
- Accepts base64 image.
- Calls Lovable AI Gateway with `google/gemini-2.5-pro` (vision) using a structured tool-call schema:
  ```
  extract_id_data({first_name, last_name, date_of_birth (YYYY-MM-DD), document_number, document_type, address?, nationality?, gender?})
  ```
- Returns the parsed object.
- Public (`verify_jwt = false` in `supabase/config.toml`).

In `Adhesion.tsx` step 2 (KYC Principal): add a tab/toggle between **"Scanner ma pièce (OCR)"** and **"Vérification Nirva"**. The OCR option uses `IdCardScanner` and pre-fills the form; the Nirva option keeps the existing `DiditVerification`.

**Mobile scroll fix**: when entering step 2 (and any step) on mobile, the page jumps mid-form because the focused element is not the top. Fix in `Adhesion.tsx`:
- In the `setStep` wrapper / `goNext` / `goPrev`, after state update, call `window.scrollTo({ top: 0, behavior: 'smooth' })` AND scroll the step container ref into view at `block: 'start'`.
- Add a `topOfStepRef` `<div ref={topOfStepRef} />` at the top of each step content and `topOfStepRef.current?.scrollIntoView({ block: 'start' })` after step change.

---

## 6. Futuristic 3D African woman face for KYC animation

Replace the `<ScanFace>` icon in `DiditVerification.tsx` with a **generated 3D image**:
- Generate via Lovable AI (`google/gemini-3-pro-image-preview`) prompt: *"Hyper-futuristic 3D render of a young African woman's face being scanned by holographic blue/violet laser lines, neon glow, cyberpunk aesthetic, dark background, photo-realistic, head-on portrait, ethereal lighting"*.
- Save as `src/assets/kyc-3d-scan.jpg`.
- In the animation panel: show this image in the center face frame with the existing rotating rings, scan line, and corner brackets overlaid on top. Add a `mix-blend-mode: screen` overlay tint.
- Keep the "Système prêt" pill and `NIRVA · KYC v1.0` mono labels.

---

## 7. Dashboard premium redesign (mobile + web)

`src/pages/client/Dashboard.tsx` and `src/layouts/ClientLayout.tsx`:
- New rotating `FamilyBanner` hero strip at the top with greeting overlaid.
- Replace flat stat cards with `PremiumCard` elevated variants + gradient accents.
- Add a **"Couverture" donut** (Nature/Espèces split of active contract).
- Bottom mobile nav: glassmorphism with active indicator pill.
- Re-tune spacing for `<sm` viewport: container px-3, card padding p-4, font sizes step down by one level.

---

## 8. Full responsive audit & coherence fixes

Sweep the following pages and fix overflow / cramped / missing breakpoint issues:
- Landing: `Header`, `HeroSection`, `FormulesSection`, `SimulateurSection`, `FAQSection`, `Footer`.
- Client: `Dashboard`, `Souscrire`, `Adhesion`, `Sinistre`, `SinistreSuivi`, `SinistresHistorique`, `Documents`, `Paiements`, `Profil`, `Beneficiaires`, `Contrats`, `Assistance`.
- Admin: `Dashboard`, `Utilisateurs`, `Contrats`, `Sinistres`, `Finances`, `Reporting`, `Communication`, `Parametrage`, `Outils`, `Fraude`.

Patterns applied:
- All tables wrapped in `overflow-x-auto` + minimum column widths.
- Replace fixed `text-3xl` headings with `text-2xl sm:text-3xl`.
- Replace `grid-cols-3` etc. with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Replace fixed `gap-8` with `gap-4 sm:gap-6 lg:gap-8`.
- Sidebars: collapse to drawer below `md`.
- All forms: 1-col mobile, 2-col sm+.
- Sticky bottom action bars on multi-step forms (mobile).

---

## Files plan

**New:**
- `src/assets/operators/{orange-money,wave,mtn-momo,moov-money}.svg`
- `src/assets/banners/{family-united,family-elderly,family-mother,family-pro}.jpg`
- `src/assets/kyc-3d-scan.jpg`
- `src/pages/client/PaiementCheckoutV2.tsx`
- `src/components/payment/PremiumPaymentBanner.tsx`
- `src/components/payment/SimulationBadge.tsx`
- `src/components/simulator/PremiumSimulatorCore.tsx`
- `src/components/marketing/FamilyBanner.tsx`
- `src/components/kyc/IdCardScanner.tsx`
- `supabase/functions/kyc-ocr-extract/index.ts`

**Modified:**
- `src/App.tsx` — route swap to V2 checkout.
- `src/components/payment/OperatorPicker.tsx` — new logos.
- `src/components/landing/SimulateurSection.tsx` — premium core.
- `src/pages/admin/Outils.tsx` — premium core.
- `src/pages/client/Adhesion.tsx` — OCR scanner in step 2, mobile scroll fix, premium simulator in step 0.
- `src/components/kyc/DiditVerification.tsx` — replace icon with 3D face image.
- `src/pages/client/Dashboard.tsx` + `src/layouts/ClientLayout.tsx` — premium redesign.
- `supabase/config.toml` — declare `kyc-ocr-extract` with `verify_jwt = false`.
- ~25 page/layout files for responsive polish (touch-up only).

---

## Technical notes

- AI image generation runs at build/setup time via `lovable_ai.py` script and outputs to `src/assets/`.
- OCR edge function uses tool-calling (structured output) with `google/gemini-2.5-pro` for accuracy.
- All existing biometric, payment, and contract-creation logic is preserved.
- No DB migrations needed.
- Keep `PaiementCheckout.tsx` deleted/renamed after V2 replaces it (old `?resume=` query still supported).
