import { motion } from "framer-motion";
import { User, ShoppingBag, Star, ChevronRight, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfilePage() {
  const { t, lang, toggleLang } = useLanguage();
  const [, setLocation] = useLocation();

  const lastOrderId = localStorage.getItem("last_order_id");
  const lastTotal = localStorage.getItem("last_order_total");

  const menuItems = [
    {
      icon: ShoppingBag,
      label: t("My Orders", "طلباتي"),
      desc: lastOrderId ? `${t("Last:", "آخر طلب:")} #${lastOrderId}` : t("No orders yet", "لا طلبات بعد"),
      onClick: () => lastOrderId && setLocation("/confirmation"),
    },
    {
      icon: Star,
      label: t("Leave a Review", "اكتب تقييم"),
      desc: t("Share your experience", "شارك تجربتك"),
      onClick: () => setLocation("/review"),
    },
    {
      icon: MessageSquare,
      label: t("Language", "اللغة"),
      desc: lang === "en" ? "English" : "العربية",
      onClick: toggleLang,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 pb-28">
      <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("Guest", "زائر")}</h2>
              <p className="text-sm text-muted-foreground">{t("Welcome back!", "أهلاً وسهلاً!")}</p>
            </div>
          </div>

          {lastOrderId && lastTotal && (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.12), rgba(255,122,0,0.04))", border: "1px solid rgba(255,122,0,0.2)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("Last Order", "آخر طلب")}</p>
                  <p className="font-bold text-foreground">#{lastOrderId}</p>
                  <p className="text-sm text-primary font-semibold mt-0.5">{parseFloat(lastTotal).toFixed(0)} ﷼</p>
                </div>
                <ShoppingBag size={28} className="text-primary/40" />
              </div>
            </div>
          )}

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.99 }}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/3 transition text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6">
            <Link href="/admin">
              <button className="w-full py-3 rounded-2xl border border-white/8 text-sm text-muted-foreground hover:text-foreground hover:border-white/15 transition">
                {t("Admin Panel", "لوحة التحكم")}
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
