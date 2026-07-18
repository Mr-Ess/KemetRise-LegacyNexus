import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  dailyConversations: Array<{ day: string; count: number }>;
  topQuestions: Array<{ question: string; count: number }>;
  escalationRate: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Line Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("conversations_last_7_days")}</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.dailyConversations}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Questions */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("top_questions")}</h4>
        <div className="space-y-1 text-xs">
          {data.topQuestions.slice(0, 3).map((q, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/50"
            >
              <span className="truncate flex-1">{q.question}</span>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {q.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation Rate */}
      <div className="p-3 bg-background/50 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("escalation_rate")}</span>
          <span className="text-lg font-bold text-primary">{data.escalationRate}%</span>
        </div>
      </div>
    </div>
  );
};
