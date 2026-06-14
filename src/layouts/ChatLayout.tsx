import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, Languages, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";

  return (
    <div className={cn("h-screen flex flex-col bg-background overflow-hidden", R && "rtl")}>
      {/* Minimal header */}
      <header className="h-10 border-b border-border bg-background/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-display text-xs font-bold text-primary tracking-widest">KemetRise AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => i18n.changeLanguage(R ? "en" : "ar")}
            className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Languages className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => navigate("/settings")}
            className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}
