import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { initializeStore } from "@/lib/initStore";
import { settingsStore } from "@/lib/store";
import NavBar from "@/components/NavBar";
import ClearCartDialog from "@/components/ClearCartDialog";
import BottomNav from "@/components/BottomNav";
import GlobalWhatsAppButton from "@/components/GlobalWhatsAppButton";
import Home from "@/pages/Home";
import RestaurantPage from "@/pages/RestaurantPage";
import BranchPage from "@/pages/BranchPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import ConfirmationPage from "@/pages/ConfirmationPage";
import ReviewPage from "@/pages/ReviewPage";
import FavoritesPage from "@/pages/FavoritesPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminAuth from "@/pages/admin/AdminAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRestaurants from "@/pages/admin/AdminRestaurants";
import AdminBranches from "@/pages/admin/AdminBranches";
import AdminMenu from "@/pages/admin/AdminMenu";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminOffers from "@/pages/admin/AdminOffers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminDeliveryZones from "@/pages/admin/AdminDeliveryZones";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminBackgrounds from "@/pages/admin/AdminBackgrounds";
import OffersPage from "@/pages/OffersPage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_auth") === "true");
  if (!authed) return <AdminAuth onAuth={() => setAuthed(true)} />;
  return <AdminLayout>{children}</AdminLayout>;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function AppRoutes() {
  useEffect(() => {
    initializeStore();
    const settings = settingsStore.get();
    if (settings.primary_color) {
      document.documentElement.style.setProperty("--primary", hexToHsl(settings.primary_color));
    }
  }, []);

  return (
    <>
      <Switch>
        <Route path="/admin">
          <AdminGuard><AdminDashboard /></AdminGuard>
        </Route>
        <Route path="/admin/restaurants">
          <AdminGuard><AdminRestaurants /></AdminGuard>
        </Route>
        <Route path="/admin/branches">
          <AdminGuard><AdminBranches /></AdminGuard>
        </Route>
        <Route path="/admin/menu">
          <AdminGuard><AdminMenu /></AdminGuard>
        </Route>
        <Route path="/admin/offers">
          <AdminGuard><AdminOffers /></AdminGuard>
        </Route>
        <Route path="/admin/coupons">
          <AdminGuard><AdminCoupons /></AdminGuard>
        </Route>
        <Route path="/admin/reviews">
          <AdminGuard><AdminReviews /></AdminGuard>
        </Route>
        <Route path="/admin/settings">
          <AdminGuard><AdminSettings /></AdminGuard>
        </Route>
        <Route path="/admin/delivery-zones">
          <AdminGuard><AdminDeliveryZones /></AdminGuard>
        </Route>
        <Route path="/admin/customers">
          <AdminGuard><AdminCustomers /></AdminGuard>
        </Route>
        <Route path="/admin/analytics">
          <AdminGuard><AdminAnalytics /></AdminGuard>
        </Route>
        <Route path="/admin/banners">
          <AdminGuard><AdminBanners /></AdminGuard>
        </Route>
        <Route path="/admin/backgrounds">
          <AdminGuard><AdminBackgrounds /></AdminGuard>
        </Route>

        <Route>
          <NavBar />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/restaurant/:restaurantId" component={RestaurantPage} />
            <Route path="/restaurant/:restaurantId/branch/:branchId" component={BranchPage} />
            <Route path="/offers" component={OffersPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/confirmation" component={ConfirmationPage} />
            <Route path="/review" component={ReviewPage} />
            <Route path="/favorites" component={FavoritesPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route component={NotFound} />
          </Switch>
          <ClearCartDialog />
          <GlobalWhatsAppButton />
          <BottomNav />
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
