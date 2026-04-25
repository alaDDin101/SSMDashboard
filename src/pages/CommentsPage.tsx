import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { CommentModerationItemDto, PagedResult } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function CommentsPage() {
  const [result, setResult] = useState<PagedResult<CommentModerationItemDto>>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await api.get<PagedResult<CommentModerationItemDto>>("/comments", { page: String(page), pageSize: "20" }));
    } catch { toast.error("خطأ"); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const action = async (id: string, type: "approve" | "reject" | "delete") => {
    setActionLoading(id);
    try {
      if (type === "delete") await api.delete(`/comments/${id}`);
      else await api.post(`/comments/${id}/${type}`);
      toast.success(type === "approve" ? "تمت الموافقة" : type === "reject" ? "تم الرفض" : "تم الحذف");
      fetchComments();
    } catch { toast.error("خطأ"); } finally { setActionLoading(null); }
  };

  const totalPages = Math.ceil(result.totalCount / 20);

  return (
    <div>
      <PageHeader title="إدارة التعليقات" />
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !result.items.length ? (
        <div className="text-center py-12 text-muted-foreground">لا توجد تعليقات</div>
      ) : (
        <div className="space-y-3">
          {result.items.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{c.userEmail || "مجهول"}</span>
                    <span className="text-xs text-muted-foreground">على: {c.articleTitle}</span>
                    {c.isApproved ? <Badge className="bg-success text-primary-foreground text-xs">موافق عليه</Badge> : <Badge variant="secondary" className="text-xs">بانتظار المراجعة</Badge>}
                    {c.isDeleted && <Badge variant="destructive" className="text-xs">محذوف</Badge>}
                  </div>
                  <p className="text-sm text-foreground mb-2">{c.body}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "yyyy/MM/dd HH:mm")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!c.isApproved && !c.isDeleted && (
                    <Button variant="ghost" size="icon" className="text-success" disabled={actionLoading === c.id} onClick={() => action(c.id, "approve")} title="موافقة">
                      <Check size={16} />
                    </Button>
                  )}
                  {!c.isDeleted && (
                    <Button variant="ghost" size="icon" className="text-warning" disabled={actionLoading === c.id} onClick={() => action(c.id, "reject")} title="رفض">
                      <X size={16} />
                    </Button>
                  )}
                  {!c.isDeleted && (
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={actionLoading === c.id} onClick={() => action(c.id, "delete")} title="حذف">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronRight size={16} /></Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronLeft size={16} /></Button>
        </div>
      )}
    </div>
  );
}
