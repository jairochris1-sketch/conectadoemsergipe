import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SocialProvider } from "@/context/SocialContext";
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

const queryClient = new QueryClient();

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocialProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                <Route path="/page/:slug" element={<SitePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SocialProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
