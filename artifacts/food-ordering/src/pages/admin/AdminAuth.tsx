import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock } from "lucide-react";

export default function AdminAuth({ onAuth }: { onAuth: () => void }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      sessionStorage.setItem("admin_auth", "true");
      onAuth();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("Admin Login", "تسجيل دخول الإدارة")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("Enter your password to continue", "أدخل كلمة المرور للمتابعة")}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder={t("Password", "كلمة المرور")}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              data-testid="input-admin-password"
            />
            {error && <p className="text-xs text-destructive mt-1">{t("Incorrect password", "كلمة المرور غير صحيحة")}</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition" data-testid="btn-admin-login">
            {t("Login", "دخول")}
          </button>
          <p className="text-xs text-center text-muted-foreground">{t("Hint: admin123", "تلميح: admin123")}</p>
        </form>
      </div>
    </div>
  );
}
