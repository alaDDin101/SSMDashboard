import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  ProjectListItemDto,
  ProjectsPageSettingsDto,
  ProjectsPageSettingsUpsertDto,
  PagedResult,
} from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import MediaThumb from "@/components/MediaThumb";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ArticleRichEditor } from "@/components/ArticleRichEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 20;

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<ProjectsPageSettingsUpsertDto>({
    title: "المشاريع والمبادرات",
    leadText: null,
    introHtml: "",
    isVisible: true,
  });

  const [result, setResult] = useState<PagedResult<ProjectListItemDto>>({ items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE });
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItemDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSettingsLoading(true);
    api
      .get<ProjectsPageSettingsDto>("/projects/settings")
      .then((d) => {
        setSettingsForm({
          title: d.title,
          leadText: d.leadText,
          introHtml: d.introHtml ?? "",
          isVisible: d.isVisible,
        });
      })
      .catch(() => toast.error("تعذّر تحميل إعدادات الصفحة"))
      .finally(() => setSettingsLoading(false));
  }, []);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) };
      if (search) params.search = search;
      if (sectionFilter !== "all") params.section = sectionFilter;
      setResult(await api.get<PagedResult<ProjectListItemDto>>("/projects", params));
    } catch {
      toast.error("خطأ في تحميل المشاريع");
    } finally {
      setListLoading(false);
    }
  }, [page, search, sectionFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsForm.title.trim()) {
      toast.error("أدخل عنوان الصفحة");
      return;
    }
    setSettingsSaving(true);
    try {
      await api.put<ProjectsPageSettingsDto>("/projects/settings", {
        ...settingsForm,
        title: settingsForm.title.trim(),
        leadText: settingsForm.leadText?.trim() || null,
        introHtml: settingsForm.introHtml?.trim() || null,
      });
      toast.success("تم حفظ إعدادات صفحة المشاريع");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget.id}`);
      toast.success("تم الحذف");
      setDeleteTarget(null);
      await fetchList();
    } catch {
      toast.error("خطأ");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(result.totalCount / PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
      <PageHeader title="المشاريع والمبادرات" createLabel="إضافة مشروع" createTo="/projects/new" />

      <form onSubmit={saveSettings}>
        <Card>
          <CardHeader>
            <CardTitle>إعدادات صفحة المشاريع في الموقع</CardTitle>
            <CardDescription>العنوان والمقدمة يظهران أعلى صفحة المشاريع عند التفعيل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <p className="text-sm text-muted-foreground">جاري التحميل…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Switch
                    checked={settingsForm.isVisible}
                    onCheckedChange={(v) => setSettingsForm((f) => ({ ...f, isVisible: v }))}
                  />
                  <Label>إظهار صفحة المشاريع في الموقع</Label>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>عنوان الصفحة</Label>
                  <Input value={settingsForm.title} onChange={(e) => setSettingsForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>مقدمة قصيرة</Label>
                  <Input
                    value={settingsForm.leadText || ""}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, leadText: e.target.value || null }))}
                    placeholder="سطر تحت العنوان…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص تمهيدي (HTML)</Label>
                  <ArticleRichEditor
                    value={settingsForm.introHtml || ""}
                    onChange={(html) => setSettingsForm((f) => ({ ...f, introHtml: html }))}
                    className="min-h-[220px]"
                    placeholder="مقدمة اختيارية قبل أقسام المشاريع…"
                  />
                </div>
                <Button type="submit" disabled={settingsSaving}>
                  {settingsSaving ? "جاري الحفظ…" : "حفظ الإعدادات"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-3">قائمة المشاريع والمبادرات</h2>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث في العنوان أو الرابط…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-9"
            />
          </div>
          <Select value={sectionFilter} onValueChange={(v) => { setSectionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              <SelectItem value="1">ماذا تقدم الحركة عملياً</SelectItem>
              <SelectItem value="2">مشاريع خدمية أو توعوية</SelectItem>
              <SelectItem value="3">خطط مستقبلية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={[
            { key: "cover", label: "الغلاف", render: (p) => <MediaThumb url={p.coverImageUrl} alt={p.title} /> },
            { key: "title", label: "العنوان" },
            { key: "sectionName", label: "القسم" },
            { key: "displayOrder", label: "الترتيب" },
            {
              key: "isPublished",
              label: "الحالة",
              render: (p) =>
                p.isPublished ? (
                  <Badge className="bg-success text-primary-foreground">منشور</Badge>
                ) : (
                  <Badge variant="secondary">مسودة</Badge>
                ),
            },
            { key: "viewCount", label: "المشاهدات" },
            { key: "createdAt", label: "التاريخ", render: (p) => format(new Date(p.createdAt), "yyyy/MM/dd") },
          ]}
          data={result.items}
          loading={listLoading}
          onEdit={(p) => navigate(`/projects/${p.id}`)}
          onDelete={(p) => setDeleteTarget(p)}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight size={16} />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronLeft size={16} />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
