import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Sparkles, Zap, Bot, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, formatPercentage } from "@/lib/numberFormatter";

interface AIAgentState {
  responsesToday: number;
  autoResolutionRate: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}

interface KPICardsProps {
  state: AIAgentState;
}

export const KPICards: React.FC<KPICardsProps> = ({ state }) => {
  const { t, i18n } = useTranslation();

  const kpis = [
    {
      label: t("conversations_today"),
      value: formatNumber(state.responsesToday, i18n.language as 'en' | 'ar'),
      icon: MessageSquare,
      change: 12,
      tooltip: t("conversations_today_tooltip"),
    },
    {
      label: t("auto_resolution_rate"),
      value: formatPercentage(state.autoResolutionRate, i18n.language as 'en' | 'ar'),
      icon: Sparkles,
      change: 5,
      tooltip: t("auto_resolution_rate_tooltip"),
    },
    {
      label: t("avg_response_time"),
      value: `${formatNumber(state.avgResponseTime, i18n.language as 'en' | 'ar')}ms`,
      icon: Zap,
      change: -3,
      tooltip: t("avg_response_time_tooltip"),
    },
    {
      label: t("customer_satisfaction"),
      value: `${formatNumber(state.customerSatisfaction, i18n.language as 'en' | 'ar')}/5`,
      icon: Bot,
      change: 8,
      tooltip: t("customer_satisfaction_tooltip"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change >= 0;

        return (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="card-elevated group cursor-help hover:shadow-md transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                        <p className="text-3xl font-bold">{kpi.value}</p>
                        <div className="flex items-center gap-1 text-xs">
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className={isPositive ? "text-green-500" : "text-red-500"}
                          >
                            {isPositive ? "+" : ""}{kpi.change}%
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>{kpi.tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};
