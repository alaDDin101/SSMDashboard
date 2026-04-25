import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { ProjectDetailDto, ProjectUpsertDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ImageUrlField from "@/components/ImageUrlField";
import ArticleReaderPreview from "@/components/ArticleReaderPreview";
import { ArticleRichEditor } from "@/components/ArticleRichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Eye, LayoutPanelLeft, PenSquare } from "lucide-react";

function isBodyHtmlEffectivelyEmpty(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s|&nbsp;/gi, "").trim();
  return text.length === 0;
}

function approximateWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s/).filter(Boolean).length;
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectUpsertDto>({
    section: 1,
    title: "",
    slug: "",
    summary: "",
    bodyHtml: "",
    coverImageUrl: "",
    displayOrder: 0,
    isPublished: false,
    publishedAt: null,
  });

  const bodyChars = form.bodyHtml.length;
  const bodyWords = useMemo(() => approximateWordCount(form.bodyHtml), [form.bodyHtml]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api
        .get<ProjectDetailDto>(`/projects/${id}`)
        .then((d) => {
          setForm({
            section: d.section,
            title: d.title,
            slug: d.slug,
            summary: d.summary || "",
            bodyHtml: d.bodyHtml,
            coverImageUrl: d.coverImageUrl || "",
            displayOrder: d.displayOrder,
            isPublished: d.isPublished,
            publishedAt: d.publishedAt,
          });
        })
        .catch(() => toast.error("غير موجود"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBodyHtmlEffectivelyEmpty(form.bodyHtml)) {
      toast.error("أضف محتوى للمشروع في المحرّر");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        publishedAt: form.isPublished ? form.publishedAt || new Date().toISOString() : null,
      };
      if (isEdit) {
        await api.put<ProjectDetailDto>(`/projects/${id}`, body);
        toast.success("تم التحديث");
      } else {
        await api.post<ProjectDetailDto>("/projects", body);
        toast.success("تم الإنشاء");
      }
      navigate("/projects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const previewProps = {
    title: form.title,
    slug: form.slug || "…",
    summary: form.summary,
    bodyHtml: form.bodyHtml,
    coverImageUrl: form.coverImageUrl,
  };

  const editorBlock = (
    <div className="flex flex-col gap-2 min-h-0 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="project-body-rich" className="text-sm font-medium">
          محرّر المحتوى
        </Label>
        <div className="flex gap-2">
          <Badge variant="secondary" className="font-mono text-xs font-normal">
            {bodyChars.toLocaleString("ar-EG")} حرف
          </Badge>
          <Badge variant="outline" className="font-mono text-xs font-normal">
            ~{bodyWords.toLocaleString("ar-EG")} كلمة
          </Badge>
        </div>
      </div>
      <ArticleRichEditor
        id="project-body-rich"
        value={form.bodyHtml}
        onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))}
        className="min-h-0 flex-1"
        placeholder="اكتب تفاصيل المشروع أو المبادرة…"
      />
    </div>
  );

  const previewBlock = (
    <div className="flex h-full min-h-[420px] flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
        <Eye className="h-4 w-4" />
        معاينة القارئ
      </div>
      <ArticleReaderPreview {...previewProps} className="h-[70vh] max-h-[640px] md:h-full md:max-h-none md:min-h-0 md:flex-1" />
    </div>
  );

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-16">
      <PageHeader title={isEdit ? "تعديل مشروع" : "إضافة مشروع"} backTo="/projects" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>بيانات المشروع</CardTitle>
            <CardDescription>القسم، العنوان، الرابط، الغلاف، الترتيب، والنشر.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>القسم على صفحة المشاريع</Label>
              <Select
                value={String(form.section)}
                onValueChange={(v) => setForm((f) => ({ ...f, section: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">ماذا تقدم الحركة عملياً</SelectItem>
                  <SelectItem value="2">مشاريع خدمية أو توعوية</SelectItem>
                  <SelectItem value="3">خطط مستقبلية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>الرابط (Slug)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  dir="ltr"
                  className="text-left font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الملخص</Label>
              <Textarea
                value={form.summary || ""}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={3}
                className="resize-y"
                placeholder="يظهر في بطاقات المشروع…"
              />
            </div>
            <div className="space-y-2">
              <Label>ترتيب العرض داخل القسم</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <ImageUrlField label="صورة الغلاف" value={form.coverImageUrl || ""} onChange={(v) => setForm((f) => ({ ...f, coverImageUrl: v }))} />
            <Separator />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                <Label>نشر المشروع</Label>
              </div>
              {form.isPublished ? (
                <p className="text-xs text-muted-foreground">تاريخ النشر يُضبط تلقائياً عند الحفظ إن لم يكن مضبوطاً مسبقاً.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutPanelLeft className="h-5 w-5" />
              محتوى المشروع
            </CardTitle>
            <CardDescription>محرّر غني مع معاينة — نفس تجربة المقالات.</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor" className="gap-2">
                    <PenSquare className="h-4 w-4" />
                    المحرر
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    المعاينة
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="editor" className="mt-4">
                  {editorBlock}
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  {previewBlock}
                </TabsContent>
              </Tabs>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="h-[78vh] max-h-[820px] min-h-[520px] rounded-lg border bg-card">
                <ResizablePanel defaultSize={54} minSize={32}>
                  <div className="flex h-full min-h-0 flex-col gap-2 p-4">{editorBlock}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={46} minSize={28}>
                  <div className="flex h-full min-h-0 flex-col bg-muted/20 p-3">{previewBlock}</div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? "جاري الحفظ…" : "حفظ"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate("/projects")}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
