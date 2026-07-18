import { usePresence } from "@/hooks/usePresence";
import { Circle } from "lucide-react";

export default function PresenceIndicator() {
  const users = usePresence();
  const count = users.length;
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border border-border text-xs">
      <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
      <span className="text-muted-foreground">{count} online</span>
    </div>
  );
}
