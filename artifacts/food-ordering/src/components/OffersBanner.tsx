import { useLanguage } from "@/contexts/LanguageContext";
import { Tag } from "lucide-react";

export default function OffersBanner() {
  const { t } = useLanguage();

  const offers = [
    { en: "Use code SAVE10 for 10% off any order", ar: "استخدم كود SAVE10 للحصول على خصم 10%" },
    { en: "First order? Use FIRST20 for 20% off", ar: "طلبك الأول؟ استخدم FIRST20 للحصول على خصم 20%" },
    { en: "Free delivery with code FREESHIP", ar: "توصيل مجاني مع كود FREESHIP" },
    { en: "Orders over 50 SAR get automatic 10% discount", ar: "الطلبات فوق 50 ريال تحصل على خصم تلقائي 10%" },
  ];

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={16} className="text-primary" />
        <span className="text-sm font-semibold text-primary">{t("Special Offers", "العروض الخاصة")}</span>
      </div>
      <div className="flex flex-col gap-2">
        {offers.map((offer, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t(offer.en, offer.ar)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
