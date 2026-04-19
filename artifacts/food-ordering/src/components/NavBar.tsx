import { Link, useLocation } from "wouter";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export default function NavBar() {
  const { cartCount } = useCart();
  const { lang, toggleLang, t, isRTL } = useLanguage();
  const [location] = useLocation();

  const isHome = location === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="text-xl font-bold text-primary cursor-pointer tracking-tight" data-testid="nav-logo">
            {t("OrderNow", "اطلب الآن")}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            data-testid="btn-toggle-lang"
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>

          {!isHome && (
            <Link href="/">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all" data-testid="btn-home">
                {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                {t("Home", "الرئيسية")}
              </button>
            </Link>
          )}

          <Link href="/cart">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-all" data-testid="btn-cart">
              <ShoppingCart size={22} className="text-foreground" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  data-testid="cart-count-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
