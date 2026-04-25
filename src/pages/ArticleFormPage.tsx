import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { ArticleCommentDto, ArticleDetailDto, ArticleUpsertDto, CategoryCardDto } from "@/lib/types";
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

function CommentTreeNode({ comment, depth = 0 }: { comment: ArticleCommentDto; depth?: number }) {
  const dateText = new Date(comment.createdAt).toLocaleString("ar");
  return (
    <div className={`${depth > 0 ? "ms-6 border-s ps-4" : ""} rounded-md border bg-background/50 p-3`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{comment.userDisplayName || "عضو"}</span>
        <span>{dateText}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
      {comment.replies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentTreeNode key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ArticleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryCardDto[]>([]);
  const [articleDetails, setArticleDetails] = useState<ArticleDetailDto | null>(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const [likesPage, setLikesPage] = useState(1);
  const ENGAGEMENT_PAGE_SIZE = 10;
  const [form, setForm] = useState<ArticleUpsertDto>({
    categoryId: "",
    title: "",
    slug: "",
    summary: "",
    bodyHtml: "",
    coverImageUrl: "",
    isPublished: false,
    publishedAt: null,
  });

  const bodyChars = form.bodyHtml.length;
  const bodyWords = useMemo(() => approximateWordCount(form.bodyHtml), [form.bodyHtml]);

  const loadArticleDetails = async (articleId: string, cPage: number, lPage: number) => {
    const d = await api.get<ArticleDetailDto>(`/articles/${articleId}`, {
      commentsPage: String(cPage),
      commentsPageSize: String(ENGAGEMENT_PAGE_SIZE),
      likesPage: String(lPage),
      likesPageSize: String(ENGAGEMENT_PAGE_SIZE),
    });
    setArticleDetails(d);
    return d;
  };

  useEffect(() => {
    api.get<CategoryCardDto[]>("/categories").then(setCategories).catch(() => {});
    if (isEdit) {
      setLoading(true);
      loadArticleDetails(id, commentsPage, likesPage)
        .then((d) => {
          setForm({
            categoryId: d.categoryId,
            title: d.title,
            slug: d.slug,
            summary: d.summary || "",
            bodyHtml: d.bodyHtml,
            coverImageUrl: d.coverImageUrl || "",
            isPublished: d.isPublished,
            publishedAt: d.publishedAt,
          });
        })
        .catch(() => toast.error("غير موجود"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, commentsPage, likesPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("اختر تصنيفاً");
      return;
    }
    if (isBodyHtmlEffectivelyEmpty(form.bodyHtml)) {
      toast.error("أضف محتوى للمقال في المحرّر");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        publishedAt: form.isPublished ? form.publishedAt || new Date().toISOString() : null,
      };
      if (isEdit) {
        const updated = await api.put<ArticleDetailDto>(`/articles/${id}`, body);
        setArticleDetails(updated); // keeps edited fields reflected immediately
        toast.success("تم التحديث");
      } else {
        await api.post("/articles", body);
        toast.success("تم الإنشاء");
      }
      navigate("/articles");
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
        <Label htmlFor="article-body-rich" className="text-sm font-medium">
          محرّر النص (تنسيق، ألوان، صور)
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
        id="article-body-rich"
        value={form.bodyHtml}
        onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))}
        className="min-h-0 flex-1"
        placeholder="ابدأ كتابة المقال… استخدم شريط الأدوات للعناوين، الألوان، الحجم، والصور (رفع من الجهاز)."
      />
      <p className="text-xs text-muted-foreground leading-relaxed">
        لا حاجة لمعرفة HTML: الصور تُرفع عبر زر الصورة وتُحفظ في المحتوى. تُحدَّث المعاينة تلقائياً. اسحب الفاصل بين المحرّر والمعاينة على الشاشات الواسعة.
      </p>
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
      <PageHeader title={isEdit ? "تعديل المقال" : "إضافة مقال"} backTo="/articles" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>بيانات المقال</CardTitle>
            <CardDescription>العنوان، الرابط، التصنيف، الغلاف، والنشر.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label>التصنيف</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر تصنيفاً" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الملخص</Label>
              <Textarea
                value={form.summary || ""}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={3}
                className="resize-y"
                placeholder="مختصر يظهر في قوائم المقالات وبطاقات المشاركة…"
              />
            </div>
            <ImageUrlField
              label="صورة الغلاف"
              value={form.coverImageUrl || ""}
              onChange={(v) => setForm((f) => ({ ...f, coverImageUrl: v }))}
            />
            <Separator />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                <Label>نشر المقال</Label>
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
              محتوى المقال
            </CardTitle>
            <CardDescription>محرّر نص غني مع معاينة حيّة كما يظهر للقارئ تقريباً.</CardDescription>
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
            {saving ? "جاري الحفظ…" : "حفظ المقال"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate("/articles")}>
            إلغاء
          </Button>
        </div>
      </form>

      {isEdit && articleDetails ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>إعجابات المقال</CardTitle>
              <CardDescription>إجمالي الإعجابات: {articleDetails.likedUsers.totalCount}</CardDescription>
            </CardHeader>
            <CardContent>
              {articleDetails.likedUsers.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد إعجابات بعد.</p>
              ) : (
                <div className="max-h-[420px] space-y-2 overflow-auto pe-1">
                  {articleDetails.likedUsers.items.map((like) => (
                    <div key={`${like.userId}-${like.likedAt}`} className="rounded-md border bg-background/50 p-3 text-sm">
                      <div className="font-medium">{like.userDisplayName || like.userEmail || "مستخدم"}</div>
                      {like.userEmail ? <div className="text-xs text-muted-foreground">{like.userEmail}</div> : null}
                      <div className="mt-1 text-xs text-muted-foreground">{new Date(like.likedAt).toLocaleString("ar")}</div>
                    </div>
                  ))}
                </div>
              )}
              {articleDetails.likedUsers.totalCount > articleDetails.likedUsers.pageSize ? (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={likesPage <= 1} onClick={() => setLikesPage((p) => Math.max(1, p - 1))}>
                    السابق
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    صفحة {articleDetails.likedUsers.page} من {Math.max(1, Math.ceil(articleDetails.likedUsers.totalCount / articleDetails.likedUsers.pageSize))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={likesPage >= Math.max(1, Math.ceil(articleDetails.likedUsers.totalCount / articleDetails.likedUsers.pageSize))}
                    onClick={() => setLikesPage((p) => p + 1)}
                  >
                    التالي
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تعليقات المقال</CardTitle>
              <CardDescription>إجمالي التعليقات: {articleDetails.comments.totalCount}</CardDescription>
            </CardHeader>
            <CardContent>
              {articleDetails.comments.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد تعليقات بعد.</p>
              ) : (
                <div className="max-h-[420px] space-y-3 overflow-auto pe-1">
                  {articleDetails.comments.items.map((comment) => (
                    <CommentTreeNode key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
              {articleDetails.comments.totalCount > articleDetails.comments.pageSize ? (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={commentsPage <= 1} onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}>
                    السابق
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    صفحة {articleDetails.comments.page} من {Math.max(1, Math.ceil(articleDetails.comments.totalCount / articleDetails.comments.pageSize))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={commentsPage >= Math.max(1, Math.ceil(articleDetails.comments.totalCount / articleDetails.comments.pageSize))}
                    onClick={() => setCommentsPage((p) => p + 1)}
                  >
                    التالي
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
