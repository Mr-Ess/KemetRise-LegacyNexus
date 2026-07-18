import { useEffect, useState } from "react";
import { rolesApi } from "@/services/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "moderator" | "user";

const UserRolesAdmin = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const my = await rolesApi.myRoles();
      const admin = my.includes("admin");
      setIsAdmin(admin);
      if (admin) {
        const all = await rolesApi.listAll();
        setRows(all);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!userId.trim()) { toast.error("Enter a user ID"); return; }
    try {
      await rolesApi.assign(userId.trim(), role);
      toast.success("Role assigned");
      setUserId("");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    try { await rolesApi.remove(id); toast.success("Role removed"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return null;
  if (!isAdmin) return (
    <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border text-xs text-muted-foreground">
      <ShieldCheck className="w-4 h-4 inline mr-2 text-primary" />
      User role administration is only visible to admins.
    </div>
  );

  return (
    <div className="mt-6 space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
      <h3 className="font-display text-sm text-primary flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> ADMIN: USER ROLE ASSIGNMENTS
      </h3>
      <div className="flex flex-wrap gap-2">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User UUID" className="bg-secondary border-border text-foreground text-xs flex-1 min-w-[240px]" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs font-body text-foreground">
          <option value="user">user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
        <Button size="sm" onClick={assign} className="font-display text-xs">Assign</Button>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded border border-border/50 text-xs">
            <div>
              <span className="font-mono text-muted-foreground">{r.user_id}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary font-display text-[10px]">{r.role}</span>
            </div>
            <button onClick={() => remove(r.id)} className="p-1 rounded text-muted-foreground hover:text-blood-red hover:bg-blood-red/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {!rows.length && <p className="text-xs text-muted-foreground">No role records yet.</p>}
      </div>
    </div>
  );
};

export default UserRolesAdmin;
