import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { useBrands } from "@/context/BrandsContext";
import TeamInvites from "@/components/settings/TeamInvites";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Team() {
  const navigate = useNavigate();
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState<string>(brands[0]?.id || "");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="font-display text-lg text-primary">Team Management</h1>
        </div>

        {brands.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 border border-border rounded-lg bg-card">
            Add a brand first to manage its team.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Brand:</span>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {brandId && (
              <div className="p-4 border border-primary/20 rounded-lg bg-card">
                <TeamInvites brandId={brandId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
