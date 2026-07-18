import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, RefreshCcw, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition-transform hover:scale-110">
          <Star className={cn("w-5 h-5", i <= value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
        </button>
      ))}
    </div>
  );
}

export default function UserReviews() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [reviews, setReviews] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ listing_id: "", rating: 5, review_text: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: rev }, { data: orders }] = await Promise.all([
      db.from("mp_reviews").select("*, mp_listings(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      db.from("mp_orders").select("mp_order_items(listing_id, mp_listings(id, name))").eq("user_id", user.id).eq("status", "completed"),
    ]);
    setReviews(rev ?? []);
    // Collect unique listings from completed orders for writing new reviews
    const reviewed = new Set((rev ?? []).map((r: any) => r.listing_id));
    const uniq: any[] = [];
    (orders ?? []).forEach((o: any) => {
      (o.mp_order_items ?? []).forEach((item: any) => {
        const l = item.mp_listings;
        if (l && !reviewed.has(l.id) && !uniq.find((u: any) => u.id === l.id)) uniq.push(l);
      });
    });
    setListings(uniq);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.listing_id) return toast.error(R ? "اختر منتجاً" : "Select a listing");
    setSaving(true);
    const { error } = await db.from("mp_reviews").insert({
      listing_id: form.listing_id,
      user_id: user!.id,
      rating: form.rating,
      review: form.review_text,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم إرسال التقييم" : "Review submitted");
    setDlg(false);
    setForm({ listing_id: "", rating: 5, review_text: "" });
    load();
  };

  const del = async (id: string) => {
    await db.from("mp_reviews").delete().eq("id", id).eq("user_id", user!.id);
    setReviews(p => p.filter(r => r.id !== id));
    toast.success(R ? "تم الحذف" : "Deleted");
  };

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "—";

  return (
    <UserPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              {R ? "تقييماتي" : "My Reviews"}
            </h1>
            <p className="text-sm text-muted-foreground">{reviews.length} {R ? "تقييم" : "reviews"} · {R ? "متوسط" : "avg"} {avg} ★</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            {listings.length > 0 && <Button size="sm" onClick={() => setDlg(true)} className="gap-1.5"><Plus className="w-4 h-4" />{R ? "تقييم جديد" : "New Review"}</Button>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لم تقيّم أي منتج بعد" : "You haven't reviewed anything yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <Card key={r.id} className="border-border/50 hover:border-yellow-500/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{r.mp_listings?.name || (R ? "منتج" : "Listing")}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={cn("w-3.5 h-3.5", i <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => del(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{R ? "تقييم جديد" : "Write a Review"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>{R ? "المنتج" : "Listing"}</Label>
                <Select value={form.listing_id} onValueChange={v => setForm({ ...form, listing_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={R ? "اختر منتجاً..." : "Select listing..."} /></SelectTrigger>
                  <SelectContent>{listings.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "التقييم" : "Rating"}</Label>
                <div className="mt-2"><StarPicker value={form.rating} onChange={v => setForm({ ...form, rating: v })} /></div>
              </div>
              <div>
                <Label>{R ? "رأيك" : "Your Review"}</Label>
                <Textarea value={form.review_text} onChange={e => setForm({ ...form, review_text: e.target.value })} rows={3} className="mt-1" placeholder={R ? "شاركنا رأيك..." : "Share your experience..."} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={save} disabled={saving}>{saving ? "…" : (R ? "إرسال التقييم" : "Submit Review")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UserPortalLayout>
  );
}
