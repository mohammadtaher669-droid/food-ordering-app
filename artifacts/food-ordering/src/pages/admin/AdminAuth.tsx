import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, Eye, EyeOff } from "lucide-react";
import matAmiLogo from "@assets/لوجو_الموقع_مطعمي_1776635393637.png";

function getAdminPassword(): string {
  return localStorage.getItem("admin_password") || "admin123";
}

export default function AdminAuth({ onAuth }: { onAuth: () => void }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === getAdminPassword()) {
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
          <img src={matAmiLogo} alt="Mat'ami" className="h-14 w-14 rounded-2xl object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">{t("Admin Login", "تسجيل دخول الإدارة")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("Enter your password to continue", "أدخل كلمة المرور للمتابعة")}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder={t("Enter your password", "أدخل كلمة المرور")}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                data-testid="input-admin-password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                <Lock size={11} /> {t("Incorrect password. Please try again.", "كلمة المرور غير صحيحة. حاول مجدداً.")}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition"
            data-testid="btn-admin-login"
          >
            {t("Login", "دخول")}
          </button>
        </form>
      </div>
    </div>
  );
}
