import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { tasksApi } from "@/services/system";
import { toast } from "sonner";

interface Task { id: string; title: string; due_at?: string | null; status: string; agent_kind?: string }
interface Props { tasks: Task[]; onSelectDay?: (d: Date) => void; onChanged?: () => void }

export default function CalendarView({ tasks, onSelectDay, onChanged }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }), [cursor]);
  const dayTasks = (d: Date) => tasks.filter(t => t.due_at && isSameDay(new Date(t.due_at), d));

  const drop = async (d: Date) => {
    if (!dragId) return;
    try {
      await tasksApi.update(dragId, { due_at: d.toISOString() });
      toast.success(`نُقلت لـ ${format(d, "d MMM")}`);
      onChanged?.();
    } catch (e: any) { toast.error(e.message); }
    setDragId(null);
  };

  return (
    <div className="border border-primary/30 rounded-lg bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <Button size="sm" variant="ghost" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4 h-4"/></Button>
        <h3 className="font-bold text-primary">{format(cursor, "MMMM yyyy")}</h3>
        <Button size="sm" variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4"/></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center opacity-60 py-1">{d}</div>)}
        {Array.from({length: days[0].getDay()}).map((_,i) => <div key={`pad${i}`}/>)}
        {days.map(d => {
          const items = dayTasks(d);
          return (
            <div key={d.toISOString()}
              onClick={() => onSelectDay?.(d)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(d)}
              className="min-h-[60px] border border-primary/10 rounded p-1 text-left hover:bg-primary/5 cursor-pointer">
              <div className="text-xs">{format(d, "d")}</div>
              {items.slice(0,2).map(t => (
                <div key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  className="text-[10px] truncate text-primary cursor-grab active:cursor-grabbing">
                  {t.agent_kind === "ai" ? "🤖" : "👤"} {t.title}
                </div>
              ))}
              {items.length > 2 && <div className="text-[10px] opacity-60">+{items.length-2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
