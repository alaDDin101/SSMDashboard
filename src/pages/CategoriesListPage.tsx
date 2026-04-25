import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { CategoryCardDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import MediaThumb from "@/components/MediaThumb";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

export default function CategoriesListPage() {
  const [cats, setCats] = useState<CategoryCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CategoryCardDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try { setCats(await api.get<CategoryCardDto[]>("/categories")); } catch { toast.error("خطأ"); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/categories/${deleteTarget.id}`); toast.success("تم الحذف"); setDeleteTarget(null); fetch(); } catch { toast.error("خطأ"); } finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="التصنيفات" createLabel="إضافة تصنيف" createTo="/categories/new" />
      <DataTable
        columns={[
          { key: "thumb", label: "الصورة", render: c => <MediaThumb url={c.backgroundImageUrl} alt={c.name} /> },
          { key: "name", label: "الاسم" },
          { key: "slug", label: "الرابط" },
          { key: "displayOrder", label: "الترتيب" },
        ]}
        data={cats}
        loading={loading}
        onEdit={c => navigate(`/categories/${c.id}`)}
        onDelete={c => setDeleteTarget(c)}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
