import { Globe, MoreHorizontal, Users, Filter } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { branchesApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";

type Branch = {
  id: string;
  name: string;
  staff: number;
  ai: number;
  human: number;
  status: "Active" | "Inactive" | "Maintenance";
  activity: "High Activity" | "Moderate" | "Low";
  x: number;
  y: number;
};

const mapDbStatus = (s: string): Branch["status"] =>
  s === "active" ? "Active" : s === "maintenance" ? "Maintenance" : "Inactive";

const BranchActivityCard = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | Branch["status"]>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const load = async () => {
    try {
      const rows = await branchesApi.list();
      const mapped: Branch[] = rows.map((r: any, i: number) => {
        const d = r.data || {};
        return {
          id: r.id,
          name: r.name,
          staff: d.staff ?? (d.ai ?? 0) + (d.human ?? 0),
          ai: d.ai ?? 0,
          human: d.human ?? 0,
          status: mapDbStatus(r.status),
          activity: (d.activity as Branch["activity"]) ?? "Moderate",
          x: d.x ?? (40 + (i * 7) % 50),
          y: d.y ?? (30 + (i * 5) % 30),
        };
      });
      setBranches(mapped);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("branches-rt").on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filteredBranches = useMemo(() => {
    if (statusFilter === "all") return branches;
    return branches.filter((b) => b.status === statusFilter);
  }, [statusFilter, branches]);


  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">BRANCH ACTIVITY & GLOBAL LOGISTICS</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md transition-colors ${showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-1.5 mb-3 p-2 bg-secondary/30 rounded-md border border-border/50">
          <span className="text-[10px] font-display text-muted-foreground">Status:</span>
          {(["all", "Active", "Inactive", "Maintenance"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-display transition-colors ${
                statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Map */}
        <div className="lg:col-span-3 relative bg-secondary/20 rounded-md overflow-hidden h-48">
          <svg viewBox="0 0 100 50" className="w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice">
            <path d="M15,12 L18,10 L22,11 L25,10 L28,12 L26,16 L22,18 L18,20 L14,18 L12,15 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
            <path d="M22,22 L25,20 L28,22 L27,28 L24,32 L21,30 L20,26 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
            <path d="M42,10 L55,8 L58,12 L56,16 L52,18 L48,20 L44,18 L40,14 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
            <path d="M44,20 L56,18 L60,22 L58,30 L54,35 L48,36 L42,32 L40,26 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
            <path d="M60,12 L72,10 L80,14 L78,20 L74,22 L68,24 L62,20 L58,16 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
            <path d="M78,30 L84,28 L88,32 L86,36 L82,38 L78,34 Z" fill="hsl(42,50%,35%)" opacity="0.5" />
          </svg>

          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(42,40%,25%,0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(42,40%,25%,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />

          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${branch.x}%`, top: `${branch.y}%` }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-primary rounded-full gold-glow animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/30 animate-pulse-ring" />
              </div>
            </div>
          ))}

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
            <line x1="52" y1="35" x2="58" y2="38" stroke="hsl(42,85%,55%)" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.5" />
          </svg>
        </div>

        {/* Branch details */}
        <div className="lg:col-span-2 space-y-2">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="bg-secondary/50 rounded-md p-3 border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-sm font-bold text-foreground">{branch.name}</span>
                <span className="text-[10px] font-display px-2 py-0.5 rounded-full bg-scarab/10 text-scarab">{branch.status}</span>
              </div>
              <p className="text-xs font-body text-muted-foreground mb-1">
                Staff {branch.staff} (<span className="text-nile">{branch.ai} AI</span>, <span className="text-primary">{branch.human} Human</span>)
              </p>
              <p className="text-[10px] text-muted-foreground">Status: {branch.activity}</p>
            </div>
          ))}
          {filteredBranches.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No branches match filter</p>
          )}
          <button className="w-full py-2 rounded-md bg-primary text-primary-foreground font-display text-[10px] font-bold tracking-widest hover:bg-primary/90 transition-colors">
            MANAGE WORKFORCE (ALLOCATE AI/HUMAN)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchActivityCard;
