import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore } from "@/lib/store";
import { MapPin, User, Phone, MessageSquare, Send } from "lucide-react";

function generateOrderId(): string {
  return "ORD-" + Math.random().toString(36).toUpperCase().substring(2, 8);
}

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart, selectedRestaurantId, selectedBranchId } = useCart();
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();

  const orderType = (localStorage.getItem("checkout_order_type") || "delivery") as "delivery" | "pickup";
  const deliveryFee = parseFloat(localStorage.getItem("checkout_delivery_fee") || "0");
  const discount = parseFloat(localStorage.getItem("checkout_discount") || "0");
  const finalTotal = parseFloat(localStorage.getItem("checkout_final_total") || String(cartTotal));
  const appliedCoupon = localStorage.getItem("checkout_applied_coupon") || "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocationField] = useState("");
  const [notes, setNotes] = useState("");
  const [agreeOffers, setAgreeOffers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const restaurant = restaurantStore.getAll().find((r) => r.id === selectedRestaurantId);
  const branch = branchStore.getAll().find((b) => b.id === selectedBranchId);

  if (!restaurant || !branch || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">{t("No items in cart", "لا توجد عناصر في السلة")}</p>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("Name is required", "الاسم مطلوب");
    if (!phone.trim()) errs.phone = t("Phone is required", "الجوال مطلوب");
    if (orderType === "delivery" && !location.trim()) errs.location = t("Location is required for delivery", "الموقع مطلوب للتوصيل");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const orderId = generateOrderId();
    const orderTypeLine = orderType === "delivery" ? (lang === "ar" ? "توصيل 🚗" : "Delivery 🚗") : (lang === "ar" ? "استلام 🏪" : "Pickup 🏪");

    const itemsText = cartItems
      .map((ci) => `• ${lang === "ar" ? ci.item.name_ar : ci.item.name_en} x${ci.quantity} — ${(ci.item.price * ci.quantity).toFixed(0)} ${lang === "ar" ? "ريال" : "SAR"}`)
      .join("\n");

    const message = lang === "ar"
      ? `🧾 طلب جديد\nرقم الطلب: #${orderId}\n---\nالمطعم: ${restaurant.name_ar}\nالفرع: ${branch.name_ar}\nنوع الطلب: ${orderTypeLine}\n---\nالعناصر:\n${itemsText}\n---\nالمجموع الفرعي: ${cartTotal.toFixed(0)} ريال\nرسوم التوصيل: ${deliveryFee} ريال\nالخصم: -${discount.toFixed(0)} ريال\nالإجمالي: ${finalTotal.toFixed(0)} ريال\n---\nالاسم: ${name}\nالجوال: ${phone}${orderType === "delivery" ? `\nالموقع: ${location}` : ""}\nملاحظات: ${notes || "—"}\n---\nالموافقة على استقبال العروض: ${agreeOffers ? "نعم" : "لا"}`
      : `🧾 New Order\nOrder ID: #${orderId}\n---\nRestaurant: ${restaurant.name_en}\nBranch: ${branch.name_en}\nOrder Type: ${orderTypeLine}\n---\nItems:\n${itemsText}\n---\nSubtotal: ${cartTotal.toFixed(0)} SAR\nDelivery Fee: ${deliveryFee} SAR\nDiscount: -${discount.toFixed(0)} SAR\nTotal: ${finalTotal.toFixed(0)} SAR\n---\nName: ${name}\nPhone: ${phone}${orderType === "delivery" ? `\nLocation: ${location}` : ""}\nNotes: ${notes || "—"}\n---\nAgree to receive offers: ${agreeOffers ? "Yes" : "No"}`;

    const whatsappUrl = `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(message)}`;

    localStorage.setItem("last_order_id", orderId);
    localStorage.setItem("last_order_restaurant", JSON.stringify({ name_en: restaurant.name_en, name_ar: restaurant.name_ar }));
    localStorage.setItem("last_order_branch", JSON.stringify({ name_en: branch.name_en, name_ar: branch.name_ar }));
    localStorage.setItem("last_order_total", String(finalTotal));
    localStorage.setItem("last_order_whatsapp", whatsappUrl);

    clearCart();
    window.open(whatsappUrl, "_blank");
    setLocation("/confirmation");
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-6">{t("Checkout", "إتمام الطلب")}</h1>

          {/* Order Type Badge */}
          <div className="bg-card border border-white/5 rounded-xl p-3 mb-5 flex items-center gap-3">
            {restaurant.logoType === "image" && restaurant.logo
              ? <img src={restaurant.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
              : <span className="text-2xl">{restaurant.logo}</span>}
            <div>
              <p className="text-sm font-medium">{t(restaurant.name_en, restaurant.name_ar)} · {t(branch.name_en, branch.name_ar)}</p>
              <p className="text-xs text-muted-foreground">{orderType === "delivery" ? t("Delivery", "توصيل") : t("Pickup", "استلام")}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-white/5 rounded-2xl p-5 mb-5 space-y-4">
            <h2 className="font-semibold text-foreground">{t("Your Details", "بياناتك")}</h2>

            <div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                <User size={13} /> {t("Name", "الاسم")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Your full name", "اسمك الكامل")}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                data-testid="input-name"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                <Phone size={13} /> {t("Phone", "الجوال")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("05xxxxxxxx", "05xxxxxxxx")}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                data-testid="input-phone"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>

            {orderType === "delivery" && (
              <div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                  <MapPin size={13} /> {t("Location / Address", "الموقع / العنوان")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocationField(e.target.value)}
                  placeholder={t("Your delivery address", "عنوان التوصيل")}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  data-testid="input-location"
                />
                {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                <MessageSquare size={13} /> {t("Notes (optional)", "ملاحظات (اختياري)")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Any special requests?", "أي طلبات خاصة؟")}
                rows={2}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                data-testid="input-notes"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeOffers}
                onChange={(e) => setAgreeOffers(e.target.checked)}
                className="w-4 h-4 accent-primary"
                data-testid="checkbox-offers"
              />
              <span className="text-sm text-muted-foreground">{t("I agree to receive offers and promotions", "أوافق على استقبال العروض والترويجات")}</span>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-card border border-white/5 rounded-2xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("Subtotal", "المجموع الفرعي")}</span>
              <span>{cartTotal.toFixed(0)} {t("SAR", "ريال")}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("Delivery", "التوصيل")}</span>
                <span>{deliveryFee} {t("SAR", "ريال")}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>{t("Discount", "الخصم")}</span>
                <span>-{discount.toFixed(0)} {t("SAR", "ريال")}</span>
              </div>
            )}
            <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base">
              <span>{t("Total", "الإجمالي")}</span>
              <span className="text-primary">{finalTotal.toFixed(0)} {t("SAR", "ريال")}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition text-base"
            data-testid="btn-send-whatsapp"
          >
            <Send size={18} />
            {t("Send Order via WhatsApp", "إرسال الطلب عبر واتساب")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
