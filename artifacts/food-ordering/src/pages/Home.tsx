import { useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore, offerStore } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import OffersCarousel from "@/components/OffersCarousel";
import { ChevronRight, ChevronLeft, MapPin, ArrowDown, Sparkles } from "lucide-react";

function HeroSection() {
  const { t, isRTL } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ position: "relative" }}>
      {/* Animated radial background */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0F0F0F]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 30%, #FF7A0025 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 80% 70%, #FF7A0015 0%, transparent 60%)",
          }}
        />
        {/* Decorative food icons */}
        {["🍗", "🥩", "🍔", "🌮", "🍳", "🥗", "🍛", "🫕"].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-10 select-none pointer-events-none"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 55}%`,
            }}
            animate={{
              y: [0, -12, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 4 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            {icon}
          </motion.div>
        ))}
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,122,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,0,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-4 max-w-3xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={13} className="text-primary" />
            <span className="text-sm text-primary font-medium">{t("3 Premium Restaurants", "٣ مطاعم متميزة")}</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-foreground leading-tight mb-4"
        >
          {t(
            <>Order from your<br /><span className="text-primary">favorite restaurants</span></>,
            <><span className="text-primary">اطلب من مطاعمك</span><br />بسهولة</>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto"
        >
          {t(
            "Fresh meals, real ingredients — delivered straight to your door via WhatsApp",
            "وجبات طازجة وعبر واتساب مباشرة إلى بابك"
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <Link href="#restaurants">
            <button
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25 flex items-center gap-2"
              data-testid="btn-start-ordering"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("restaurants-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {isRTL ? <ChevronLeft size={18} /> : null}
              {t("Start Ordering", "ابدأ الطلب")}
              {!isRTL ? <ChevronRight size={18} /> : null}
            </button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown size={20} className="text-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function RestaurantCard({ restaurant, branches, index }: {
  restaurant: ReturnType<typeof restaurantStore.getAll>[number];
  branches: ReturnType<typeof branchStore.getAll>;
  index: number;
}) {
  const { t, isRTL } = useLanguage();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const branchCount = branches.filter((b) => b.restaurant_id === restaurant.id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
    >
      <Link href={`/restaurant/${restaurant.id}`}>
        <div
          className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
          style={{
            border: `1px solid ${restaurant.color}20`,
            boxShadow: `0 0 0 0 ${restaurant.color}40`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${restaurant.color}30, 0 8px 32px rgba(0,0,0,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${restaurant.color}40`;
          }}
          data-testid={`card-restaurant-${restaurant.id}`}
        >
          {/* Cover Image */}
          <div className="relative h-44 overflow-hidden">
            {restaurant.cover_image ? (
              <img
                src={restaurant.cover_image}
                alt={restaurant.name_en}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${restaurant.color}30 0%, ${restaurant.color}08 50%, #1A1A1A 100%)`,
                }}
              >
                {/* Decorative pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 30% 50%, ${restaurant.color} 1px, transparent 1px), radial-gradient(circle at 70% 30%, ${restaurant.color} 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center opacity-20"
                    style={{ background: restaurant.color }}
                  />
                </div>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/20 to-transparent" />
            {/* Color accent bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1"
              style={{ background: `linear-gradient(90deg, ${restaurant.color}, ${restaurant.color}60)` }}
            />
          </div>

          {/* Content */}
          <div className="bg-[#1A1A1A] p-5">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div
                className="-mt-10 w-16 h-16 rounded-xl border-2 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg relative z-10"
                style={{ borderColor: `${restaurant.color}40`, background: `${restaurant.color}15` }}
              >
                {restaurant.logoType === "image" && restaurant.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{restaurant.logo || "🍽️"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {t(restaurant.name_en, restaurant.name_ar)}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <MapPin size={10} />
                    <span>{branchCount} {t("branches", "فروع")}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t(
                    restaurant.tagline_en || restaurant.description_en,
                    restaurant.tagline_ar || restaurant.description_ar
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <div
                className="flex items-center gap-1 text-sm font-semibold transition-all duration-200 group-hover:gap-2"
                style={{ color: restaurant.color }}
              >
                {t("View Menu", "عرض القائمة")}
                <ChevronIcon size={14} />
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ background: i < 4 ? restaurant.color : `${restaurant.color}30` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));
  const offers = useStore(useCallback(() => offerStore.getActive(), []));

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Hero */}
      <HeroSection />

      <div className="max-w-5xl mx-auto px-4 pb-20" id="restaurants-section">
        {/* Offers Carousel */}
        {offers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <OffersCarousel offers={offers} />
          </motion.div>
        )}

        {/* Restaurants */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-foreground">{t("Our Restaurants", "مطاعمنا")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("Premium dining, delivered your way", "تجربة طعام مميزة بأسلوبك")}</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {restaurants.map((restaurant, i) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} branches={branches} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
