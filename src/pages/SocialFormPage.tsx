import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { SocialLinkDto, SocialLinkUpsertDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ImageUrlField from "@/components/ImageUrlField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SocialFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SocialLinkUpsertDto>({ platformKey: "", label: "", url: "", iconUrl: "", displayOrder: 0, isActive: true });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get<SocialLinkDto>(`/social/${id}`).then(d => setForm({ platformKey: d.platformKey, label: d.label || "", url: d.url, iconUrl: d.iconUrl || "", displayOrder: d.displayOrder, isActive: d.isActive })).catch(() => toast.error("غير موجود")).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/social/${id}`, form); toast.success("تم التحديث"); } else { await api.post("/social", form); toast.success("تم الإنشاء"); }
      navigate("/social");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "خطأ"); } finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <PageHeader title={isEdit ? "تعديل الرابط" : "إضافة رابط"} backTo="/social" />
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-4">
        <div className="space-y-2"><Label>المنصة</Label><Input value={form.platformKey} onChange={e => setForm(f => ({ ...f, platformKey: e.target.value }))} required placeholder="facebook, twitter, ..." dir="ltr" className="text-left" /></div>
        <div className="space-y-2"><Label>التسمية</Label><Input value={form.label || ""} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
        <div className="space-y-2"><Label>الرابط</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required dir="ltr" className="text-left" /></div>
        <ImageUrlField
          label="رابط الأيقونة"
          value={form.iconUrl || ""}
          onChange={v => setForm(f => ({ ...f, iconUrl: v }))}
        />
        <div className="space-y-2"><Label>الترتيب</Label><Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} /></div>
        <div className="flex items-center gap-3"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>نشط</Label></div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/social")}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}
