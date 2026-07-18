import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PresenceUser = { user_id: string; email?: string; online_at: string };

export function usePresence(channelName = "global-presence") {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase.channel(channelName, { config: { presence: { key: user.id } } });
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const flat: PresenceUser[] = Object.values(state).flat() as any;
          setUsers(flat);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: user.id, email: user.email, online_at: new Date().toISOString() });
          }
        });
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [channelName]);

  return users;
}
