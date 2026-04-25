import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { SliderSlideDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import MediaThumb from "@/components/MediaThumb";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SliderListPage() {
  const [slides, setSlides] = useState<SliderSlideDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SliderSlideDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await api.get<SliderSlideDto[]>("/slider");
      setSlides(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/slider/${deleteTarget.id}`);
      toast.success("تم الحذف بنجاح");
      setDeleteTarget(null);
      fetchSlides();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setDeleting(false);
    }
  };

  const linkTypeLabel = (t: number) => {
    if (t === 1) return <Badge variant="outline">رابط خارجي</Badge>;
    if (t === 2) return <Badge variant="secondary">مقال</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">بدون</Badge>;
  };

  return (
    <div>
      <PageHeader title="السلايدر" createLabel="إضافة شريحة" createTo="/slider/new" />
      <DataTable
        columns={[
          { key: "thumb", label: "الصورة", render: s => <MediaThumb url={s.backgroundImageUrl} alt={s.title || ""} /> },
          { key: "title", label: "العنوان", render: s => s.title || "—" },
          { key: "displayOrder", label: "الترتيب" },
          { key: "linkTargetType", label: "نوع الرابط", render: s => linkTypeLabel(s.linkTargetType) },
        ]}
        data={slides}
        loading={loading}
        onEdit={s => navigate(`/slider/${s.id}`)}
        onDelete={s => setDeleteTarget(s)}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
