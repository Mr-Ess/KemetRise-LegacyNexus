import { Skeleton } from "@/components/ui/skeleton";

export const EntityListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 mt-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-20" /></div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon = "📭", title, hint }: { icon?: string; title: string; hint?: string }) => (
  <div className="text-center py-12 text-muted-foreground">
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-sm font-display">{title}</p>
    {hint && <p className="text-xs mt-1">{hint}</p>}
  </div>
);
