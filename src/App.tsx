import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import AdminLoginPage from "./pages/AdminLogin";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import ClientDashboard from "./pages/client/Dashboard";
import SouscrirePage from "./pages/client/Souscrire";
import AdhesionPage from "./pages/client/Adhesion";
import ContratsPage from "./pages/client/Contrats";
import PaiementsPage from "./pages/client/Paiements";
import BeneficiairesPage from "./pages/client/Beneficiaires";
import SinistrePage from "./pages/client/Sinistre";
import SinistreSuivi from "./pages/client/SinistreSuivi";
import SinistresHistoriquePage from "./pages/client/SinistresHistorique";
import PaiementCheckoutPage from "./pages/client/PaiementCheckout";
import AssistancePage from "./pages/client/Assistance";
import DocumentsPage from "./pages/client/Documents";
import ProfilPage from "./pages/client/Profil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminParametrage from "./pages/admin/Parametrage";
import AdminContrats from "./pages/admin/Contrats";
import AdminFinances from "./pages/admin/Finances";
import AdminSinistres from "./pages/admin/Sinistres";
import AdminFraude from "./pages/admin/Fraude";
import AdminReporting from "./pages/admin/Reporting";
import AdminUtilisateurs from "./pages/admin/Utilisateurs";
import AdminCommunication from "./pages/admin/Communication";
import AdminOutils from "./pages/admin/Outils";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
