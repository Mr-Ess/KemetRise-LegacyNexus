import SimpleCrud from "@/components/shared/SimpleCrud";
import { TrendingUp } from "lucide-react";

export default function FinanceAnalytics() {
  return <SimpleCrud title="Finance Analytics" table="finance_analytics" icon={TrendingUp}
    fields={[
      { name: "month_year", label: "Month-Year", required: true, placeholder: "2026-05" },
      { name: "total_revenue", label: "Total Revenue", type: "number" },
      { name: "total_expenses", label: "Total Expenses", type: "number" },
      { name: "net_profit", label: "Net Profit", type: "number" },
    ]}
    columns={[
      { key: "month_year", label: "Period" },
      { key: "total_revenue", label: "Revenue" },
      { key: "total_expenses", label: "Expenses" },
      { key: "net_profit", label: "Profit" },
    ]} />;
}
