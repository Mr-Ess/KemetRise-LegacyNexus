import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { tenantDb } from "@/lib/tenantDb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButton from "@/components/shared/ExportButton";
import { BarChart3 } from "lucide-react";

const TABLES = [
  "brands", "branches", "employees", "customers", "projects", "services",
  "tasks", "marketing_campaigns", "finance_analytics", "transactions",
  "affiliates", "success_partners", "audit_logs",
];

const ReportsBuilder = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [table, setTable] = useState("projects");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    tenantDb.select(table as any, { limit: 500, orderBy: "created_at", ascending: false })
      .then((data) => { setRows(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [table]);

  const cols = useMemo(() => rows[0] ? Object.keys(rows[0]).slice(0, 6) : [], [rows]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="font-display text-lg tracking-wider text-primary">REPORTS BUILDER</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <ExportButton data={rows} filename={`${table}-report`} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Total Rows" value={rows.length} />
            <Stat label="Columns" value={cols.length} />
            <Stat label="Source" value={table} />
          </div>

          <div className="bg-card border border-border rounded-lg overflow-auto">
            {loading ? <p className="p-6 text-center text-muted-foreground">Loading...</p> : (
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>{cols.map(c => <th key={c} className="text-left p-2 font-display text-primary tracking-wider">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                      {cols.map(c => <td key={c} className="p-2 text-foreground truncate max-w-[200px]">{String(r[c] ?? "—").slice(0, 60)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <p className="text-[10px] font-display text-muted-foreground tracking-wider">{label}</p>
    <p className="text-xl font-display text-primary mt-1">{value}</p>
  </div>
);

export default ReportsBuilder;
