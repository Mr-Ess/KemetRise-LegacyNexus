import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {R ? "وصول مرفوض" : "Access Denied"}
          </h1>
          <p className="text-muted-foreground font-body">
            {R
              ? "ليس لديك صلاحية الوصول لهذه الصفحة. تواصل مع المسؤول لمنحك الصلاحية المطلوبة."
              : "You don't have permission to access this page. Contact your administrator to request access."}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {R ? "رجوع" : "Go Back"}
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            {R ? "لوحة التحكم" : "Dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
