import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Comment = { id: string; user_id: string; body: string; created_at: string };

export const Comments = ({ entityType, entityId }: { entityType: string; entityId: string }) => {
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<string>();

  const load = async () => {
    const data = await tenantDb.select("comments", {
      eq: { entity_type: entityType, entity_id: entityId },
      orderBy: "created_at",
      ascending: false,
    });
    setItems((data as any) || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id));
    load();
    const ch = supabase.channel(`comments-${entityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `entity_id=eq.${entityId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [entityType, entityId]);

  const submit = async () => {
    if (!body.trim() || !me) return;
    try {
      await tenantDb.insert("comments", { user_id: me, entity_type: entityType, entity_id: entityId, body: body.trim() } as any, {
        includeClientId: false,
        includeBrandId: false,
      });
    } catch (error: any) {
      return toast.error(String(error?.message || error));
    }
    setBody("");
  };

  const remove = async (id: string) => {
    await tenantDb.remove("comments", { id });
    toast.success("Deleted");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <MessageSquare className="w-4 h-4" />
        <span className="font-display text-xs tracking-wider">COMMENTS ({items.length})</span>
      </div>
      <div className="space-y-2">
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write a comment... use @name to mention" className="min-h-[60px] text-sm" />
        <Button onClick={submit} size="sm" disabled={!body.trim()}>Post</Button>
      </div>
      <div className="space-y-2 max-h-72 overflow-auto">
        {items.map(c => (
          <div key={c.id} className="p-2 bg-secondary/30 rounded-md border border-border/50 group">
            <p className="text-sm text-foreground whitespace-pre-wrap font-body">{c.body}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              {c.user_id === me && (
                <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-blood-red"><Trash2 className="w-3 h-3" /></button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No comments yet</p>}
      </div>
    </div>
  );
};

export default Comments;
