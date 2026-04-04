import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import AdminLoginPage from "./pages/AdminLogin";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import ClientDashboard from "./pages/client/Dashboard";
import SouscrirePage from "./pages/client/Souscrire";
import ContratsPage from "./pages/client/Contrats";
import PaiementsPage from "./pages/client/Paiements";
import BeneficiairesPage from "./pages/client/Beneficiaires";
import SinistrePage from "./pages/client/Sinistre";
import AssistancePage from "./pages/client/Assistance";
import DocumentsPage from "./pages/client/Documents";
import ProfilPage from "./pages/client/Profil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlaceholder from "./pages/admin/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Client Portal */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="souscrire" element={<SouscrirePage />} />
            <Route path="contrats" element={<ContratsPage />} />
            <Route path="paiements" element={<PaiementsPage />} />
            <Route path="beneficiaires" element={<BeneficiairesPage />} />
            <Route path="sinistre" element={<SinistrePage />} />
            <Route path="assistance" element={<AssistancePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="parametrage" element={<AdminPlaceholder title="Paramétrage Produit" />} />
            <Route path="contrats" element={<AdminPlaceholder title="Gestion des Contrats" />} />
            <Route path="finances" element={<AdminPlaceholder title="Encaissements & Finances" />} />
            <Route path="sinistres" element={<AdminPlaceholder title="Gestion des Sinistres" />} />
            <Route path="fraude" element={<AdminPlaceholder title="Anti-fraude & Conformité" />} />
            <Route path="reporting" element={<AdminPlaceholder title="Reporting & Statistiques" />} />
            <Route path="utilisateurs" element={<AdminPlaceholder title="Utilisateurs & Rôles" />} />
            <Route path="communication" element={<AdminPlaceholder title="Contenus & Communication" />} />
            <Route path="outils" element={<AdminPlaceholder title="Outils Avancés" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
