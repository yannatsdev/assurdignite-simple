import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";

const AdminLoginPage = lazy(() => import("./pages/AdminLogin"));
const ClientLayout = lazy(() => import("./layouts/ClientLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const SouscrirePage = lazy(() => import("./pages/client/Souscrire"));
const AdhesionPage = lazy(() => import("./pages/client/Adhesion"));
const ContratsPage = lazy(() => import("./pages/client/Contrats"));
const PaiementsPage = lazy(() => import("./pages/client/Paiements"));
const BeneficiairesPage = lazy(() => import("./pages/client/Beneficiaires"));
const SinistrePage = lazy(() => import("./pages/client/Sinistre"));
const SinistreSuivi = lazy(() => import("./pages/client/SinistreSuivi"));
const SinistresHistoriquePage = lazy(() => import("./pages/client/SinistresHistorique"));
const PaiementCheckoutPage = lazy(() => import("./pages/client/PaiementCheckoutV2"));
const AssistancePage = lazy(() => import("./pages/client/Assistance"));
const DocumentsPage = lazy(() => import("./pages/client/Documents"));
const ProfilPage = lazy(() => import("./pages/client/Profil"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminParametrage = lazy(() => import("./pages/admin/Parametrage"));
const AdminContrats = lazy(() => import("./pages/admin/Contrats"));
const AdminFinances = lazy(() => import("./pages/admin/Finances"));
const AdminSinistres = lazy(() => import("./pages/admin/Sinistres"));
const AdminFraude = lazy(() => import("./pages/admin/Fraude"));
const AdminReporting = lazy(() => import("./pages/admin/Reporting"));
const AdminUtilisateurs = lazy(() => import("./pages/admin/Utilisateurs"));
const AdminCommunication = lazy(() => import("./pages/admin/Communication"));
const AdminOutils = lazy(() => import("./pages/admin/Outils"));
const AdminKycDocuments = lazy(() => import("./pages/admin/KycDocuments"));
const AdminTelemetrie = lazy(() => import("./pages/admin/Telemetrie"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground"
  >
    <span className="sr-only">Chargement…</span>
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Client redirects */}
            <Route path="/souscrire" element={<Navigate to="/client/souscrire" replace />} />
            <Route path="/contrats" element={<Navigate to="/client/contrats" replace />} />
            <Route path="/paiements" element={<Navigate to="/client/paiements" replace />} />
            <Route path="/beneficiaires" element={<Navigate to="/client/beneficiaires" replace />} />
            <Route path="/sinistre" element={<Navigate to="/client/sinistre" replace />} />
            <Route path="/assistance" element={<Navigate to="/client/assistance" replace />} />
            <Route path="/documents" element={<Navigate to="/client/documents" replace />} />
            <Route path="/profil" element={<Navigate to="/client/profil" replace />} />
            <Route path="/adhesion" element={<Navigate to="/client/adhesion" replace />} />

            {/* Admin redirects */}
            <Route path="/parametrage" element={<Navigate to="/admin/parametrage" replace />} />
            <Route path="/finances" element={<Navigate to="/admin/finances" replace />} />
            <Route path="/sinistres" element={<Navigate to="/admin/sinistres" replace />} />
            <Route path="/fraude" element={<Navigate to="/admin/fraude" replace />} />
            <Route path="/reporting" element={<Navigate to="/admin/reporting" replace />} />
            <Route path="/utilisateurs" element={<Navigate to="/admin/utilisateurs" replace />} />
            <Route path="/communication" element={<Navigate to="/admin/communication" replace />} />
            <Route path="/outils" element={<Navigate to="/admin/outils" replace />} />
            <Route path="/contracts" element={<Navigate to="/client/contrats" replace />} />

            <Route path="/client" element={<ProtectedRoute requiredRole="client"><ClientLayout /></ProtectedRoute>}>
              <Route index element={<ClientDashboard />} />
              <Route path="souscrire" element={<SouscrirePage />} />
              <Route path="adhesion" element={<AdhesionPage />} />
              <Route path="contrats" element={<ContratsPage />} />
              <Route path="paiements" element={<PaiementsPage />} />
              <Route path="beneficiaires" element={<BeneficiairesPage />} />
              <Route path="sinistre" element={<SinistrePage />} />
              <Route path="sinistre/:id" element={<SinistreSuivi />} />
              <Route path="historique-sinistres" element={<SinistresHistoriquePage />} />
              <Route path="paiement" element={<PaiementCheckoutPage />} />
              <Route path="paiement/:contractId" element={<PaiementCheckoutPage />} />
              <Route path="assistance" element={<AssistancePage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="profil" element={<ProfilPage />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="parametrage" element={<AdminParametrage />} />
              <Route path="contrats" element={<AdminContrats />} />
              <Route path="finances" element={<AdminFinances />} />
              <Route path="sinistres" element={<AdminSinistres />} />
              <Route path="fraude" element={<AdminFraude />} />
              <Route path="reporting" element={<AdminReporting />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              <Route path="communication" element={<AdminCommunication />} />
              <Route path="outils" element={<AdminOutils />} />
              <Route path="kyc" element={<AdminKycDocuments />} />
              <Route path="telemetrie" element={<AdminTelemetrie />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
