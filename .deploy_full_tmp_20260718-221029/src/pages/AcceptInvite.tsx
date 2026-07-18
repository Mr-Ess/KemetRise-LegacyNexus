import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teamApi } from "@/services/system";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) navigate(`/auth?redirect=/accept-invite/${token}`);
  }, [user, token, navigate]);

  const accept = async () => {
    if (!token) return;
    setStatus("loading");
    try { await teamApi.accept(token); setStatus("done"); toast.success("Joined!"); setTimeout(() => navigate("/"), 1500); }
    catch (e: any) { setStatus("error"); setMsg(e.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="p-8 border border-primary/30 rounded-lg bg-card max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">Brand Invitation</h1>
        <p className="text-sm opacity-70">You've been invited to join a brand on KemetRise.</p>
        {status === "idle" && <Button onClick={accept} className="w-full">Accept Invitation</Button>}
        {status === "loading" && <p>Joining...</p>}
        {status === "done" && <p className="text-primary">✓ Joined! Redirecting...</p>}
        {status === "error" && <p className="text-blood-red">{msg}</p>}
      </div>
    </div>
  );
}
