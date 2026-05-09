import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LayoutDashboard, UtensilsCrossed, MapPin, BookOpen, Tag, Star, LogOut, Menu, X, Percent, Settings, Navigation, Users, BarChart2, Image, Megaphone, Printer, Palette, ListOrdered, Store } from "lucide-react";
import matAmiLogo from "@assets/لوجو_الموقع_مطعمي_1776635393637.png";

const NAV = [
  { path: "/admin", label_en: "Dashboard", label_ar: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { path: "/admin/restaurants", label_en: "Restaurants", label_ar: "المطاعم", icon: UtensilsCrossed },
  { path: "/admin/branches", label_en: "Branches", label_ar: "الفروع", icon: MapPin },
  { path: "/admin/menu", label_en: "Menu Builder", label_ar: "قائمة الطعام", icon: BookOpen },
  { path: "/admin/sorting", label_en: "Menu Sorting", label_ar: "ترتيب المنيو", icon: ListOrdered },
  { path: "/admin/branch-menu", label_en: "Branch Stock", label_ar: "مخزون الفروع", icon: Store },
  { path: "/admin/offers", label_en: "Offers", label_ar: "العروض", icon: Percent },
  { path: "/admin/coupons", label_en: "Coupons", label_ar: "الأكواد", icon: Tag },
  { path: "/admin/reviews", label_en: "Reviews", label_ar: "التقييمات", icon: Star },
  { path: "/admin/delivery-zones", label_en: "Delivery Zones", label_ar: "مناطق التوصيل", icon: Navigation },
  { path: "/admin/customers", label_en: "Customers", label_ar: "العملاء", icon: Users },
  { path: "/admin/analytics", label_en: "Analytics", label_ar: "التحليلات", icon: BarChart2 },
  { path: "/admin/banners", label_en: "Banners", label_ar: "البانرات", icon: Megaphone },
  { path: "/admin/backgrounds", label_en: "Backgrounds", label_ar: "الخلفيات", icon: Image },
  { path: "/admin/appearance", label_en: "Appearance", label_ar: "المظهر", icon: Palette },
  { path: "/admin/settings", label_en: "Settings", label_ar: "الإعدادات", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = NAV.find((item) =>
    item.exact ? location === item.path : location.startsWith(item.path) && item.path !== "/admin"
  );
  const pageTitle = currentPage ? t(currentPage.label_en, currentPage.label_ar) : t("Dashboard", "لوحة التحكم");

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar — hidden when printing */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-50 transition-transform md:translate-x-0 flex flex-col print:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={matAmiLogo} alt="Mat'ami" className="h-9 w-9 object-contain rounded-full" />
              <span className="font-bold text-primary text-base">{t("Admin", "الإدارة")}</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-muted-foreground"><X size={18} /></button>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact ? location === item.path : location.startsWith(item.path) && item.path !== "/admin";
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  data-testid={`nav-admin-${item.label_en.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon size={16} />
                  {t(item.label_en, item.label_ar)}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 flex-shrink-0 border-t border-white/5">
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

      <div className="flex-1 md:ml-60 print:ml-0">
        {/* Top bar — hidden when printing */}
        <header className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur border-b border-white/5 px-4 h-14 flex items-center gap-3 z-30 print:hidden">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-muted-foreground"><Menu size={20} /></button>
          <span className="text-sm text-muted-foreground flex-1">{t("Mat'ami Admin Panel", "لوحة إدارة مطعمي")}</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition"
            title={t("Print this page", "طباعة هذه الصفحة")}
            data-testid="btn-print"
          >
            <Printer size={14} />
            {t("Print", "طباعة")}
          </button>
        </header>

        {/* Print-only header — shows date, page title, and branding */}
        <div className="hidden print:block print-header px-8 pt-6 pb-4 border-b border-gray-300 mb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Mat'ami Admin Panel</p>
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            </div>
            <div className="text-right text-xs text-gray-500 leading-relaxed">
              <p>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </div>

        <main className="p-6 print:px-8 print:py-2">{children}</main>
      </div>
    </div>
  );
}
