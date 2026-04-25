import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { ArticleListItemDto, PagedResult } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import MediaThumb from "@/components/MediaThumb";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function ArticlesListPage() {
  const [result, setResult] = useState<PagedResult<ArticleListItemDto>>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ArticleListItemDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), pageSize: "20" };
      if (search) params.search = search;
      setResult(await api.get<PagedResult<ArticleListItemDto>>("/articles", params));
    } catch { toast.error("خطأ"); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/articles/${deleteTarget.id}`); toast.success("تم الحذف"); setDeleteTarget(null); fetchArticles(); } catch { toast.error("خطأ"); } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(result.totalCount / 20);

  return (
    <div>
      <PageHeader title="المقالات" createLabel="إضافة مقال" createTo="/articles/new" />
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pr-9" />
        </div>
      </div>
      <DataTable
        columns={[
          { key: "cover", label: "الغلاف", render: a => <MediaThumb url={a.coverImageUrl} alt={a.title} /> },
          { key: "title", label: "العنوان" },
          { key: "categoryName", label: "التصنيف" },
          { key: "isPublished", label: "الحالة", render: a => a.isPublished ? <Badge className="bg-success text-primary-foreground">منشور</Badge> : <Badge variant="secondary">مسودة</Badge> },
          { key: "viewCount", label: "المشاهدات" },
          { key: "createdAt", label: "التاريخ", render: a => format(new Date(a.createdAt), "yyyy/MM/dd") },
        ]}
        data={result.items}
        loading={loading}
        onEdit={a => navigate(`/articles/${a.id}`)}
        onDelete={a => setDeleteTarget(a)}
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronRight size={16} /></Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronLeft size={16} /></Button>
        </div>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
