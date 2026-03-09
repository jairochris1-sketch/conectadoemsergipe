import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SocialProvider } from "@/context/SocialContext";
import { PresenceProvider } from "@/components/PresenceProvider";
import FloatingChatSystem from "@/components/FloatingChatSystem";
import AppNavSidebar from "@/components/AppNavSidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import SearchPage from "./pages/Search";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import PublicProfile from "./pages/PublicProfile";
import MessagesPage from "./pages/Messages";
import ResetPassword from "./pages/ResetPassword";
import SellerDashboard from "./pages/SellerDashboard";
import SitePage from "./pages/SitePage";
import ModeratorPanel from "./pages/ModeratorPanel";
import About from "./pages/About";
import FriendsPage from "./pages/Friends";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import Stores from "./pages/Stores";
import CreateStore from "./pages/CreateStore";
import StorePage from "./pages/StorePage";
import ProductPage from "./pages/ProductPage";
import MyStore from "./pages/MyStore";
import TopSellers from "./pages/TopSellers";
import BuyCredits from "./pages/BuyCredits";
import StorePlans from "./pages/StorePlans";

const queryClient = new QueryClient();

// Layout wrapper that conditionally shows sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const hideSidebarRoutes = ["/login", "/register", "/reset-password"];
  const showSidebar = !hideSidebarRoutes.includes(pathname);
  const showFloatingChat = !hideSidebarRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen w-full">
      {showSidebar && <AppNavSidebar />}
      <div className={`flex-1 min-w-0 ${showFloatingChat ? 'lg:mr-[260px]' : ''}`}>
        {children}
      </div>
      {showFloatingChat && <FloatingChatSystem />}
    </div>
  );
};

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocialProvider>
            <PresenceProvider />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/moderator" element={<ModeratorPanel />} />
                  <Route path="/user/:userId" element={<PublicProfile />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/seller-dashboard" element={<SellerDashboard />} />
                  <Route path="/sobre" element={<Navigate to="/page/about" replace />} />
                  <Route path="/amigos" element={<FriendsPage />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route path="/servicos" element={<Services />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/stores/create" element={<CreateStore />} />
                  <Route path="/store/:slug" element={<StorePage />} />
                  <Route path="/produto/:id" element={<ProductPage />} />
                  <Route path="/minha-loja" element={<MyStore />} />
                  <Route path="/top-vendedores" element={<TopSellers />} />
                  <Route path="/comprar-creditos" element={<BuyCredits />} />
                  <Route path="/planos-loja" element={<StorePlans />} />
                  <Route path="/page/:slug" element={<SitePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </SocialProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;