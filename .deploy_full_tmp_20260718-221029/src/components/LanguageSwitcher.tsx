import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => setLanguage(i18n.language === "ar" ? "en" : "ar");
  return (
    <Button variant="ghost" size="sm" onClick={toggle} title="Toggle language">
      <Languages className="w-4 h-4 mr-1" />
      {i18n.language === "ar" ? "EN" : "ع"}
    </Button>
  );
}
