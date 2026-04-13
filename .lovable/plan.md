

# Plan — Questionnaire médical, KYC caméra, Signature fix, Documents dates, Profil avatar, Admin fix

## 1. Questionnaire médical — Oui/Non + texte libre (Step 8)

**File**: `src/pages/client/Adhesion.tsx` lines 688-703

Replace the `Switch` toggle with explicit **Oui / Non** radio-style buttons for each medical question. Add a conditional `Textarea` that appears when "Oui" is selected, allowing the user to provide details.

- Change `medicalAnswers` from `boolean[]` to `{ answer: boolean; details: string }[]`
- Each question shows two buttons: "Oui" (green) / "Non" (gray)
- When "Oui" is clicked, a `Textarea` slides in below: "Veuillez préciser..."

## 2. Step 0 — Remove formule comparison table

**File**: `src/pages/client/Adhesion.tsx` lines 360-390

Delete the entire `<div className="p-4 rounded-xl bg-accent/50 border">` block containing the comparison table. Keep the simulation form below.

## 3. Step 2 (KYC) — Replace "Photo d'identité" with camera selfie

**File**: `src/pages/client/Adhesion.tsx` lines 521-547

For the `photo` document field, replace the file upload with a camera capture button:
- Use `navigator.mediaDevices.getUserMedia({ video: true })` to access camera
- Show live video preview in a `<video>` element
- "Prendre la photo" button captures a frame to `<canvas>`, converts to Blob, uploads to storage
- Fallback: keep file upload option if camera unavailable

## 4. Step 3 (Conjoint) — Add CNI + camera selfie

**File**: `src/pages/client/Adhesion.tsx` lines 553-582

When conjoint is enabled, add:
- **Pièce d'identité (CNI/Passeport)** — file upload (already exists as `cniConjoint`)
- **Photo** — camera selfie capture (same component as Step 2), stored as `photoConjoint`

## 5. Step 13 (Signature) — Fix canvas scaling + remove OTP

**File**: `src/pages/client/Adhesion.tsx`

**Signature fix**: The canvas has `width={500} height={150}` but CSS makes it `w-full h-36`. The coordinate mapping is wrong because `getBoundingClientRect()` returns CSS size while canvas uses pixel size. Fix by scaling coordinates:
```
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const x = (clientX - rect.left) * scaleX;
const y = (clientY - rect.top) * scaleY;
```

**Remove OTP**: Delete the OTP input field and change the sign button condition from `otp.length < 4 || !hasSignature` to just `!hasSignature`.

## 6. Documents — French date format (dd/MM/yyyy)

**File**: `src/pages/client/Documents.tsx`

In all PDF generation functions, replace ISO dates (`2026-01-21`) with French format using:
```typescript
new Date(dateStr).toLocaleDateString('fr-FR') // → "21/01/2026"
```

Apply to: police, CG, CP, attestation, reçu de paiement.

## 7. Profil — Avatar image upload

**File**: `src/pages/client/Profil.tsx`

Add an avatar section at the top of the profile card:
- Circular avatar showing initials or uploaded image
- "Changer la photo" button triggers file input
- Upload to `kyc-documents/{userId}/avatar_{timestamp}.ext`
- Save URL in a new `avatar_url` column on `profiles` table
- Display the avatar in Dashboard and sidebar

**Migration**: `ALTER TABLE public.profiles ADD COLUMN avatar_url text;`

## 8. Admin login fix — Demo account

The admin account `testadmin@sonamvie.ci` / `Admin2026!` was just created successfully via the edge function. The original `admin@sonamvie.ci` never existed as a real auth user.

**Fix**: Update the login page hint text to show the correct demo credentials: `testadmin@sonamvie.ci` / `Admin2026!`.

The "edge function returned non-2xx code" error was from the chat-ai function. Need to check and fix `supabase/functions/chat-ai/index.ts` — likely missing the Lovable AI gateway URL or API key configuration.

## 9. Landing page — African family images

**File**: `src/components/landing/AvantagesSection.tsx`

Replace the current `familyImg` import with new African family stock images. Since we can't embed real stock photos, use Unsplash free images via URL or generate placeholder images with African family themes. Add 2-3 images throughout the advantages section.

## 10. Chat-AI edge function fix

**File**: `supabase/functions/chat-ai/index.ts`

Check and fix the Lovable AI gateway call. Ensure it uses the correct endpoint and handles errors gracefully instead of returning non-2xx.

---

## Files impacted

| File | Action |
|------|--------|
| `src/pages/client/Adhesion.tsx` | Remove comparison table (step 0), camera selfie (steps 2 & 3), medical Oui/Non + textarea (step 8), fix signature canvas scaling, remove OTP (step 13) |
| `src/pages/client/Documents.tsx` | French date format in all PDFs |
| `src/pages/client/Profil.tsx` | Avatar upload + display |
| `src/pages/AdminLogin.tsx` | Update demo credentials hint |
| `src/components/landing/AvantagesSection.tsx` | Replace/add African images |
| `supabase/functions/chat-ai/index.ts` | Fix non-2xx error |
| Migration SQL | Add `avatar_url` to profiles |

## Execution order

1. Fix signature canvas scaling + remove OTP
2. Medical questionnaire Oui/Non + textarea
3. Remove comparison table from step 0
4. Camera selfie for steps 2 & 3
5. Conjoint CNI + photo in step 3
6. French date format in Documents PDFs
7. Profil avatar upload (migration + UI)
8. Admin login demo credentials
9. Chat-AI edge function fix
10. Landing page images

