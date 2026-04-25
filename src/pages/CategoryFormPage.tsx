import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { CategoryCardDto, CategoryUpsertDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ImageUrlField from "@/components/ImageUrlField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function CategoryFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryUpsertDto>({ name: "", slug: "", backgroundImageUrl: "", description: "", displayOrder: 0, isActive: true });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get<CategoryCardDto>(`/categories/${id}`).then(d => setForm({ name: d.name, slug: d.slug, backgroundImageUrl: d.backgroundImageUrl || "", description: d.description || "", displayOrder: d.displayOrder, isActive: d.isActive })).catch(() => toast.error("غير موجود")).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/categories/${id}`, form); toast.success("تم التحديث"); } else { await api.post("/categories", form); toast.success("تم الإنشاء"); }
      navigate("/categories");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "خطأ"); } finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <PageHeader title={isEdit ? "تعديل التصنيف" : "إضافة تصنيف"} backTo="/categories" />
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-4">
        <div className="space-y-2"><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>الرابط (Slug)</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required dir="ltr" className="text-left" /></div>
        <ImageUrlField
          label="رابط صورة الخلفية"
          value={form.backgroundImageUrl || ""}
          onChange={v => setForm(f => ({ ...f, backgroundImageUrl: v }))}
        />
        <div className="space-y-2"><Label>الوصف</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
        <div className="space-y-2"><Label>الترتيب</Label><Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} /></div>
        <div className="flex items-center gap-3"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>نشط</Label></div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/categories")}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}
