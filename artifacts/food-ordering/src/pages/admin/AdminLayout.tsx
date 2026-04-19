import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LayoutDashboard, UtensilsCrossed, MapPin, BookOpen, Tag, Star, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { path: "/admin", label_en: "Dashboard", label_ar: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { path: "/admin/restaurants", label_en: "Restaurants", label_ar: "المطاعم", icon: UtensilsCrossed },
  { path: "/admin/branches", label_en: "Branches", label_ar: "الفروع", icon: MapPin },
  { path: "/admin/menu", label_en: "Menu", label_ar: "القائمة", icon: BookOpen },
  { path: "/admin/coupons", label_en: "Coupons", label_ar: "الأكواد", icon: Tag },
  { path: "/admin/reviews", label_en: "Reviews", label_ar: "التقييمات", icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-50 transition-transform md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-lg">{t("Admin Panel", "لوحة الإدارة")}</span>
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-muted-foreground"><X size={18} /></button>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? location === item.path : location.startsWith(item.path) && item.path !== "/admin";
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  data-testid={`nav-admin-${item.label_en.toLowerCase()}`}
                >
                  <Icon size={16} />
                  {t(item.label_en, item.label_ar)}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-0 right-0 px-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition"
            data-testid="btn-admin-logout"
          >
            <LogOut size={16} />
            {t("Logout", "تسجيل الخروج")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60">
        <header className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur border-b border-white/5 px-4 h-14 flex items-center gap-3 z-30">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-muted-foreground"><Menu size={20} /></button>
          <span className="text-sm text-muted-foreground">{t("Admin Panel", "لوحة الإدارة")}</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
