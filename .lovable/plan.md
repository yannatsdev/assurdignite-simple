## Plan – KYC Premium Sci-Fi + Admin KYC Viewer

Transform Step 2 (KYC) of `Adhesion.tsx` into an immersive full-screen wizard, add real liveness detection, and surface uploaded docs in the admin back-office.

### 1. New components – `src/components/kyc/`

- **`KycWizard.tsx`** – orchestrator (full-screen `Dialog`), 6 sub-steps with framer-motion transitions:
  1. Intro (title "Vérification d'identité", animated step list)
  2. `DocumentTypeStep` – choose CNI / Passeport / Permis (radio cards + country = Côte d'Ivoire flag)
  3. `IdScanner` (recto) – live camera with **CNI-shaped** overlay (rounded card aspect 1.586:1), animated corner brackets, vertical scan line, holographic grid, edge-detection hint ("Placez le recto dans le cadre"). Auto-capture when frame stable for 1.5s, fallback manual button. Upload to `kyc-documents` bucket.
  4. `IdScanner` (verso) – same component, second pass.
  5. `LivenessStep` – two phases:
     - "Préparez-vous pour un selfie" intro card with phone illustration + tips.
     - Live oval face frame, sequential challenges using FaceDetector API where available (else simulated timer): "Regardez droit", "Tournez la tête à gauche", "Souriez". Progress ring SVG around oval. Captures 3 frames + composite selfie.
  6. Success – animated check-draw SVG, "Vous avez été vérifié", "Terminer".
- **`KycProgressBar.tsx`** – top bar (black fill on light grey) with back chevron.
- **`ScannerOverlay.tsx`** – reusable overlay (corner pulse, scan-line, grid).

### 2. Animations – `tailwind.config.ts` + `src/index.css`

Add keyframes:
- `scan-line` (translateY 0 → 100%)
- `corner-pulse` (opacity + scale)
- `holo-grid` (slow translate)
- `check-draw` (stroke-dashoffset)
- `face-ring` (stroke-dasharray progress)

### 3. Adhesion integration – `src/pages/client/Adhesion.tsx`

- Replace inline CNI/photo upload UI in Step 2 with a single **"Démarrer la vérification d'identité"** premium CTA that opens `KycWizard`.
- Wizard returns `{ cniRecto, cniVerso, selfie, livenessFrames, selfieScore }` → uploaded via existing `handleKycUpload` and stored in `kycFiles` state.
- Same flow re-used for conjoint (separate wizard instance).
- Keep manual file fallback inside wizard if `getUserMedia` fails.

### 4. Database migration

Extend KYC payload sent on contract creation. `contracts.kyc_documents` is already `Json` – store:
```json
{
  "cni_recto": "path", "cni_verso": "path",
  "selfie": "path", "liveness_frames": ["p1","p2","p3"],
  "doc_type": "cni", "country": "CI",
  "verified_at": "ISO", "liveness_score": 0.94
}
```
No schema change required (Json column). Add **storage policy** so admins can read others' KYC files:
```sql
create policy "Admins read all kyc"
on storage.objects for select
to authenticated
using (bucket_id = 'kyc-documents' and public.has_role(auth.uid(), 'admin'));
```

### 5. Admin back-office – KYC viewer

- **`src/pages/admin/Contrats.tsx`**: add an "Actions" column with a "Voir KYC" button → opens new `<KycViewerDialog contract={c} />`.
- **`src/components/admin/KycViewerDialog.tsx`** (new):
  - Fetches signed URLs (`supabase.storage.from('kyc-documents').createSignedUrl(path, 300)`) for each document path in `contract.kyc_documents`.
  - Grid of cards: CNI recto, CNI verso, Selfie, Liveness frames thumbnails (lightbox on click).
  - Header: police, nom, doc_type, liveness score badge (vert ≥ 0.8 / orange < 0.8), `verified_at`.
  - Download button per file.

### 6. Communication / production-readiness

- Wizard works on mobile (camera `facingMode: 'environment'` for ID, `'user'` for selfie).
- Strict file size (≤ 5 Mo), JPEG compression at 0.85.
- Toasts on each upload success/failure.
- All text in French, SONAM violet/green palette + Playfair headings.
- No mocks: real `getUserMedia`, real Supabase uploads, real signed URLs in admin.

### Files touched

Created:
- `src/components/kyc/KycWizard.tsx`
- `src/components/kyc/IdScanner.tsx`
- `src/components/kyc/LivenessStep.tsx`
- `src/components/kyc/DocumentTypeStep.tsx`
- `src/components/kyc/ScannerOverlay.tsx`
- `src/components/kyc/KycProgressBar.tsx`
- `src/components/admin/KycViewerDialog.tsx`
- new migration for storage admin-read policy

Edited:
- `src/pages/client/Adhesion.tsx` (Step 2 replaced)
- `src/pages/admin/Contrats.tsx` (action column + dialog)
- `tailwind.config.ts` + `src/index.css` (keyframes)
