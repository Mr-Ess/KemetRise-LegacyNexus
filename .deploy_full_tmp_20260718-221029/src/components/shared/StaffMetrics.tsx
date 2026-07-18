import { Users, Bot } from "lucide-react";

const StaffMetrics = ({ humanCount, aiCount }: { humanCount: number; aiCount: number }) => (
  <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-md border border-border">
    <div className="flex items-center gap-1.5">
      <Users className="w-3.5 h-3.5 text-primary" />
      <span className="font-display text-xs text-foreground">{humanCount}</span>
      <span className="text-[9px] text-muted-foreground">Human</span>
    </div>
    <div className="w-px h-4 bg-border" />
    <div className="flex items-center gap-1.5">
      <Bot className="w-3.5 h-3.5 text-nile" />
      <span className="font-display text-xs text-foreground">{aiCount}</span>
      <span className="text-[9px] text-muted-foreground">AI Agents</span>
    </div>
  </div>
);

export default StaffMetrics;
