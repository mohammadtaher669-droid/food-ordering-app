import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import StarRating from "@/components/StarRating";
import { CheckCircle, Trash2 } from "lucide-react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  approved: boolean;
  timestamp: string;
}

export default function AdminReviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setReviews(JSON.parse(localStorage.getItem("admin_reviews") || "[]"));
  }, []);

  const save = (updated: Review[]) => {
    setReviews(updated);
    localStorage.setItem("admin_reviews", JSON.stringify(updated));
  };

  const approve = (id: string) => save(reviews.map((r) => r.id === id ? { ...r, approved: true } : r));
  const remove = (id: string) => save(reviews.filter((r) => r.id !== id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("Reviews", "التقييمات")}</h1>
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("No reviews yet", "لا توجد تقييمات بعد")}</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className={`bg-card border rounded-2xl p-5 ${review.approved ? "border-green-500/20" : "border-white/5"}`} data-testid={`review-${review.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(review.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review.approved ? (
                    <span className="text-xs text-green-400 font-medium">{t("Approved", "موافق عليه")}</span>
                  ) : (
                    <button
                      onClick={() => approve(review.id)}
                      className="flex items-center gap-1 text-xs text-green-400 border border-green-500/20 rounded-lg px-2.5 py-1 hover:bg-green-500/5 transition"
                      data-testid={`btn-approve-${review.id}`}
                    >
                      <CheckCircle size={12} />
                      {t("Approve", "موافقة")}
                    </button>
                  )}
                  <button
                    onClick={() => remove(review.id)}
                    className="text-destructive/60 hover:text-destructive transition"
                    data-testid={`btn-delete-review-${review.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <StarRating rating={review.rating} size={14} />
              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
