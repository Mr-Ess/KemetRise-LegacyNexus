import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AIAgentControlPanel } from "@/components/dashboard/AIAgentControlPanel";

const AdminAIAgentPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="p-2 hover:bg-background rounded-lg transition-colors"
            title={t("back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{t("ai_agent_control_panel")} (Admin)</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <AIAgentControlPanel />
    </div>
  );
};

export default AdminAIAgentPanel;
