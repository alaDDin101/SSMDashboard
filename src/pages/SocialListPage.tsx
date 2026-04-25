import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { SocialLinkDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import MediaThumb from "@/components/MediaThumb";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

export default function SocialListPage() {
  const [links, setLinks] = useState<SocialLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SocialLinkDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try { setLinks(await api.get<SocialLinkDto[]>("/social")); } catch { toast.error("خطأ"); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/social/${deleteTarget.id}`); toast.success("تم الحذف"); setDeleteTarget(null); fetch(); } catch { toast.error("خطأ"); } finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="الروابط الاجتماعية" createLabel="إضافة رابط" createTo="/social/new" />
      <DataTable
        columns={[
          { key: "icon", label: "الأيقونة", render: s => <MediaThumb url={s.iconUrl} alt={s.platformKey} size="sm" /> },
          { key: "platformKey", label: "المنصة" },
          { key: "label", label: "التسمية", render: s => s.label || "—" },
          { key: "url", label: "الرابط", render: s => <a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline truncate block max-w-[200px]" dir="ltr">{s.url}</a> },
          { key: "displayOrder", label: "الترتيب" },
        ]}
        data={links}
        loading={loading}
        onEdit={s => navigate(`/social/${s.id}`)}
        onDelete={s => setDeleteTarget(s)}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
