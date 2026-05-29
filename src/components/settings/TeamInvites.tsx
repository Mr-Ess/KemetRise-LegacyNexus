import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { teamApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Mail, Copy } from "lucide-react";

interface Props { brandId: string }

export default function TeamInvites({ brandId }: Props) {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const load = async () => {
    setMembers(await teamApi.members(brandId));
    setInvites(await teamApi.invitations(brandId));
  };
  useEffect(() => { if (brandId) load(); }, [brandId]);

  const invite = async () => {
    if (!email.trim()) return;
    const inv: any = await teamApi.invite(brandId, email.trim(), role);
    const url = `${window.location.origin}/accept-invite/${inv.token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Invite link copied");
    setEmail(""); await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input type="email" placeholder="teammate@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={invite}><Mail className="w-4 h-4 mr-1"/>Invite</Button>
      </div>

      <div>
        <p className="text-xs uppercase opacity-60 mb-2">Members ({members.length})</p>
        {members.map(m => (
          <div key={m.id} className="flex justify-between items-center p-2 border border-primary/20 rounded mb-1 text-sm">
            <span>{m.user_id.slice(0,8)}… · {m.role}</span>
            <Button size="sm" variant="ghost" onClick={async () => { await teamApi.removeMember(m.id); load(); }}><Trash2 className="w-4 h-4 text-blood-red"/></Button>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs uppercase opacity-60 mb-2">Pending Invitations ({invites.filter(i => !i.accepted_at).length})</p>
        {invites.filter(i => !i.accepted_at).map(i => (
          <div key={i.id} className="flex justify-between items-center p-2 border border-primary/20 rounded mb-1 text-sm">
            <span>{i.email} · {i.role}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/accept-invite/${i.token}`); toast.success("Copied"); }}><Copy className="w-4 h-4"/></Button>
              <Button size="sm" variant="ghost" onClick={async () => { await teamApi.revoke(i.id); load(); }}><Trash2 className="w-4 h-4 text-blood-red"/></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
