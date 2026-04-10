

# Plan — Fix admin login, redirect bug, PDF logos, UI redesign

## Diagnostic

### 1. Admin login "Database error querying schema"
The test admin user `admin@sonamvie.ci` was inserted via SQL migration with a fake UUID (`00000000-...0001`). This is not a real auth user — Supabase auth cannot authenticate it. **Fix**: Delete the fake user entry and create a real admin via the `admin-signup` edge function, or let the user sign up via the admin signup form with code `SONAM2026`.

### 2. Redirect to landing page after login
**Race condition** in `AuthContext.tsx`: `setLoading(false)` (line 42) fires immediately in `onAuthStateChange`, but `fetchRole` is called via `setTimeout` and hasn't completed yet. So `ProtectedRoute` sees `role === null`, and since `null !== 'client'`, it redirects to `/`.

**Fix**: Don't set `loading = false` until the role is fetched. Add a `roleLoading` state or await `fetchRole` before setting loading to false.

### 3. PDF logos not visible
`addPDFHeader()` in `Documents.tsx` uses text ("SONAM VIE") instead of actual logo images. jsPDF needs base64-encoded images.

**Fix**: Convert `logo-sonamvie.png` and `logo-assurdignite.png` to base64 strings and use `doc.addImage()`.

### 4. UI redesign (based on uploaded screenshots)
The uploaded images show a modern insurance app with:
- Purple gradient hero cards for active policy
- Circular avatar with profile completion %
- Quick action grid with rounded icons
- Clean card-based layout with subtle gradients
- Landing page with testimonials, stats counters, trusted brands, insurance categories

---

## Implementation

### Phase 1 — Critical fixes

**AuthContext.tsx**: Fix race condition
- Track `roleLoading` separately
- `fetchRole` sets `roleLoading = false` when done
- `loading` stays true until both session AND role are resolved

**ProtectedRoute.tsx**: Wait for role to be loaded before redirecting

**Migration**: Remove fake admin user (UUID `00000000-...0001`) from `user_roles` and `profiles` tables. The user can create a real admin via signup form with code `SONAM2026`.

### Phase 2 — PDF logos

**Documents.tsx + Adhesion.tsx**: 
- Convert `logo-sonamvie.png` and `logo-assurdignite.png` to base64 at build time by importing them and drawing to a canvas, OR embed hardcoded base64 strings
- Update `addPDFHeader()` to use `doc.addImage(base64Logo, 'PNG', x, y, w, h)` for both logos

### Phase 3 — Client dashboard redesign (inspired by screenshot 1)

**Dashboard.tsx** — Modern insurance app style:
- Avatar circle with user initials + profile completion percentage ring
- Greeting: "Bonjour, [name]!" with "Complétez votre profil" subtitle
- Hero policy card with purple gradient, policy number, validity date, "Renouveler" button
- Quick Actions grid: 4 circular icon buttons (Sinistre, Documents, Bénéficiaires, Simuler) with colored backgrounds
- "Chat with expert" card linking to assistance
- Recent payments with cleaner card layout
- Bonus fidélité progress bar

### Phase 4 — Admin dashboard redesign

- Cleaner KPI cards with icon circles
- Better chart responsiveness
- Summary cards with action buttons

### Phase 5 — Landing page redesign (inspired by screenshot 2)

**HeroSection.tsx**: Keep existing content, improve layout
**Index.tsx**: Add new sections:
- "About Company" stats section (1200+ projects, 400 workers, 17K customers style)
- Testimonials section with client quotes
- "Trusted Brands" partner logo strip
- Insurance categories grid
- "Quality Service Provider" features section

**Footer.tsx**: Improve layout with newsletter signup

### Phase 6 — Responsiveness improvements

- Client layout: collapsible sidebar on mobile, bottom nav option
- Admin layout: responsive charts, stacked KPIs on mobile
- Login pages: better mobile image sizing
- All cards: proper padding and gaps on small screens

### Phase 7 — Innovative features

- Profile completion progress indicator
- Onboarding stepper for new users (welcome modal → complete profile → subscribe)
- Notification bell with dropdown
- Quick search across client portal

---

## Files impacted

| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Fix race condition — role loading |
| `src/components/ProtectedRoute.tsx` | Wait for role before redirect |
| `src/pages/client/Dashboard.tsx` | Full redesign — modern insurance app |
| `src/pages/admin/Dashboard.tsx` | Improved KPI cards + charts |
| `src/pages/client/Documents.tsx` | Base64 logos in PDFs |
| `src/pages/client/Adhesion.tsx` | Base64 logos in receipt PDF |
| `src/components/landing/HeroSection.tsx` | Layout improvements |
| `src/pages/Index.tsx` | Add testimonials, stats, partners sections |
| `src/layouts/ClientLayout.tsx` | Responsive improvements |
| `src/layouts/AdminLayout.tsx` | Responsive improvements |
| `src/components/client/ClientSidebar.tsx` | Mobile bottom nav |
| Migration SQL | Remove fake admin user |

## Execution order

1. Fix AuthContext race condition + ProtectedRoute
2. Remove fake admin user (migration)
3. Base64 logos in PDFs
4. Client dashboard redesign
5. Admin dashboard improvements
6. Landing page new sections
7. Responsiveness + onboarding features

