import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { SliderSlideDto, SliderSlideUpsertDto, ArticleTitleSearchItemDto } from "@/lib/types";
import { escapeHtml } from "@/lib/htmlEscape";
import PageHeader from "@/components/PageHeader";
import ImageUrlField from "@/components/ImageUrlField";
import SliderSlidePreview from "@/components/SliderSlidePreview";
import SliderColorRow from "@/components/SliderColorRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const TITLE_SEARCH_MIN = 3;
const TITLE_SEARCH_DEBOUNCE_MS = 400;

const emptyTheme = (): Pick<
  SliderSlideUpsertDto,
  | "titleColor"
  | "subtitleTextColor"
  | "subtitleBadgeBackgroundColor"
  | "subtitleBadgeBorderColor"
  | "contentHtmlColor"
  | "ctaBackgroundColor"
  | "ctaTextColor"
  | "navArrowBackgroundColor"
  | "navArrowIconColor"
  | "dotActiveColor"
  | "dotInactiveColor"
  | "overlayBottomColor"
  | "overlayMiddleColor"
  | "overlayTopColor"
> => ({
  titleColor: "",
  subtitleTextColor: "",
  subtitleBadgeBackgroundColor: "",
  subtitleBadgeBorderColor: "",
  contentHtmlColor: "",
  ctaBackgroundColor: "",
  ctaTextColor: "",
  navArrowBackgroundColor: "",
  navArrowIconColor: "",
  dotActiveColor: "",
  dotInactiveColor: "",
  overlayBottomColor: "",
  overlayMiddleColor: "",
  overlayTopColor: "",
});

function initialForm(): SliderSlideUpsertDto {
  return {
    backgroundImageUrl: "",
    title: "",
    subtitle: "",
    contentHtml: "",
    linkTargetType: 0,
    articleId: null,
    externalUrl: "",
    openInNewTab: false,
    displayOrder: 0,
    isActive: true,
    ...emptyTheme(),
  };
}

function trimCss(s?: string | null): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export default function SliderFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SliderSlideUpsertDto>(() => initialForm());
  const [pickedArticle, setPickedArticle] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [titleSearch, setTitleSearch] = useState("");
  const [titleResults, setTitleResults] = useState<ArticleTitleSearchItemDto[]>([]);
  const [titleSearchLoading, setTitleSearchLoading] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const runTitleSearch = useCallback(async (q: string) => {
    setTitleSearchLoading(true);
    try {
      const items = await api.get<ArticleTitleSearchItemDto[]>("/slider/articles/search-by-title", {
        title: q,
        take: "20",
      });
      setTitleResults(items);
    } catch (e) {
      setTitleResults([]);
      toast.error(e instanceof Error ? e.message : "فشل البحث");
    } finally {
      setTitleSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api
        .get<SliderSlideDto>(`/slider/${id}`)
        .then((data) => {
          setForm({
            backgroundImageUrl: data.backgroundImageUrl || "",
            title: data.title || "",
            subtitle: data.subtitle || "",
            contentHtml: data.contentHtml || "",
            linkTargetType: data.linkTargetType,
            articleId: data.articleId,
            externalUrl: data.externalUrl || "",
            openInNewTab: data.openInNewTab,
            displayOrder: data.displayOrder,
            isActive: data.isActive,
            titleColor: data.titleColor ?? "",
            subtitleTextColor: data.subtitleTextColor ?? "",
            subtitleBadgeBackgroundColor: data.subtitleBadgeBackgroundColor ?? "",
            subtitleBadgeBorderColor: data.subtitleBadgeBorderColor ?? "",
            contentHtmlColor: data.contentHtmlColor ?? "",
            ctaBackgroundColor: data.ctaBackgroundColor ?? "",
            ctaTextColor: data.ctaTextColor ?? "",
            navArrowBackgroundColor: data.navArrowBackgroundColor ?? "",
            navArrowIconColor: data.navArrowIconColor ?? "",
            dotActiveColor: data.dotActiveColor ?? "",
            dotInactiveColor: data.dotInactiveColor ?? "",
            overlayBottomColor: data.overlayBottomColor ?? "",
            overlayMiddleColor: data.overlayMiddleColor ?? "",
            overlayTopColor: data.overlayTopColor ?? "",
          });
          if (data.articleId) {
            setPickedArticle({
              id: data.articleId,
              title: data.articleTitle?.trim() || "مقال",
              slug: data.articleSlug || "",
            });
            setPreviewSlug(data.articleSlug ?? null);
          } else {
            setPickedArticle(null);
            setPreviewSlug(null);
          }
          setTitleSearch("");
          setTitleResults([]);
        })
        .catch(() => toast.error("لم يتم العثور على الشريحة"))
        .finally(() => setLoading(false));
    } else {
      setForm(initialForm());
      setPickedArticle(null);
      setPreviewSlug(null);
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (form.linkTargetType !== 2) {
      setTitleResults([]);
      return;
    }
    const q = titleSearch.trim();
    if (q.length < TITLE_SEARCH_MIN) {
      setTitleResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void runTitleSearch(q);
    }, TITLE_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [titleSearch, form.linkTargetType, runTitleSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkType = form.linkTargetType;
    if (linkType === 2 && !form.articleId?.trim()) {
      toast.error("اختر مقالاً من نتائج البحث (لا يُقبل إدخال المعرف يدوياً).");
      return;
    }
    setSaving(true);
    const payload: SliderSlideUpsertDto = {
      ...form,
      backgroundImageUrl: form.backgroundImageUrl?.trim() || null,
      title: form.title?.trim() || null,
      subtitle: form.subtitle?.trim() || null,
      contentHtml: form.contentHtml?.trim() || null,
      articleId: linkType === 2 && form.articleId?.trim() ? form.articleId.trim() : null,
      externalUrl: linkType === 1 ? form.externalUrl?.trim() || null : null,
      titleColor: trimCss(form.titleColor),
      subtitleTextColor: trimCss(form.subtitleTextColor),
      subtitleBadgeBackgroundColor: trimCss(form.subtitleBadgeBackgroundColor),
      subtitleBadgeBorderColor: trimCss(form.subtitleBadgeBorderColor),
      contentHtmlColor: trimCss(form.contentHtmlColor),
      ctaBackgroundColor: trimCss(form.ctaBackgroundColor),
      ctaTextColor: trimCss(form.ctaTextColor),
      navArrowBackgroundColor: trimCss(form.navArrowBackgroundColor),
      navArrowIconColor: trimCss(form.navArrowIconColor),
      dotActiveColor: trimCss(form.dotActiveColor),
      dotInactiveColor: trimCss(form.dotInactiveColor),
      overlayBottomColor: trimCss(form.overlayBottomColor),
      overlayMiddleColor: trimCss(form.overlayMiddleColor),
      overlayTopColor: trimCss(form.overlayTopColor),
    };
    try {
      if (isEdit) {
        await api.put(`/slider/${id}`, payload);
        toast.success("تم التحديث بنجاح");
      } else {
        await api.post("/slider", payload);
        toast.success("تم الإنشاء بنجاح");
      }
      navigate("/slider");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <PageHeader title={isEdit ? "تعديل الشريحة" : "إضافة شريحة"} backTo="/slider" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 items-start">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 min-w-0">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={form.title || ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>العنوان الفرعي</Label>
            <Input value={form.subtitle || ""} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          </div>
          <ImageUrlField
            label="صورة الخلفية"
            uploadOnly
            alsoAllowUploadWith={["slider.manage"]}
            value={form.backgroundImageUrl || ""}
            onChange={(v) => setForm((f) => ({ ...f, backgroundImageUrl: v }))}
          />
          <div className="space-y-2">
            <Label>المحتوى (HTML)</Label>
            <Textarea
              value={form.contentHtml || ""}
              onChange={(e) => setForm((f) => ({ ...f, contentHtml: e.target.value }))}
              rows={4}
              dir="ltr"
              className="text-left font-mono text-sm"
            />
          </div>

          <Collapsible open={themeOpen} onOpenChange={setThemeOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                ألوان الشريحة (اختياري)
                <ChevronDown className={`h-4 w-4 transition-transform ${themeOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4 border-t border-border mt-4">
              <p className="text-xs text-muted-foreground">
                اترك الحقل فارغاً لاستخدام ألوان الموقع الافتراضية. يمكنك استخدام #RRGGBB أو rgba(...).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderColorRow label="لون عنوان الشريحة" value={form.titleColor || ""} onChange={(v) => setForm((f) => ({ ...f, titleColor: v }))} />
                <SliderColorRow label="لون نص العنوان الفرعي" value={form.subtitleTextColor || ""} onChange={(v) => setForm((f) => ({ ...f, subtitleTextColor: v }))} />
                <SliderColorRow label="خلفية شارة العنوان الفرعي" value={form.subtitleBadgeBackgroundColor || ""} onChange={(v) => setForm((f) => ({ ...f, subtitleBadgeBackgroundColor: v }))} />
                <SliderColorRow label="حد شارة العنوان الفرعي" value={form.subtitleBadgeBorderColor || ""} onChange={(v) => setForm((f) => ({ ...f, subtitleBadgeBorderColor: v }))} />
                <SliderColorRow label="لون نص المحتوى (HTML)" value={form.contentHtmlColor || ""} onChange={(v) => setForm((f) => ({ ...f, contentHtmlColor: v }))} />
                <SliderColorRow label="خلفية زر «اقرأ المزيد»" value={form.ctaBackgroundColor || ""} onChange={(v) => setForm((f) => ({ ...f, ctaBackgroundColor: v }))} />
                <SliderColorRow label="لون نص زر «اقرأ المزيد»" value={form.ctaTextColor || ""} onChange={(v) => setForm((f) => ({ ...f, ctaTextColor: v }))} />
                <SliderColorRow label="خلفية أزرار التنقل" value={form.navArrowBackgroundColor || ""} onChange={(v) => setForm((f) => ({ ...f, navArrowBackgroundColor: v }))} />
                <SliderColorRow label="لون أيقونات التنقل" value={form.navArrowIconColor || ""} onChange={(v) => setForm((f) => ({ ...f, navArrowIconColor: v }))} />
                <SliderColorRow label="لون النقطة النشطة" value={form.dotActiveColor || ""} onChange={(v) => setForm((f) => ({ ...f, dotActiveColor: v }))} />
                <SliderColorRow label="لون النقاط غير النشطة" value={form.dotInactiveColor || ""} onChange={(v) => setForm((f) => ({ ...f, dotInactiveColor: v }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">تدرج الطبقة فوق الصورة (من الأسفل → الأعلى)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SliderColorRow label="أسفل" value={form.overlayBottomColor || ""} onChange={(v) => setForm((f) => ({ ...f, overlayBottomColor: v }))} hint="مثال: rgba(15,23,42,0.9)" />
                  <SliderColorRow label="وسط" value={form.overlayMiddleColor || ""} onChange={(v) => setForm((f) => ({ ...f, overlayMiddleColor: v }))} />
                  <SliderColorRow label="أعلى" value={form.overlayTopColor || ""} onChange={(v) => setForm((f) => ({ ...f, overlayTopColor: v }))} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الرابط</Label>
              <Select
                value={String(form.linkTargetType)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setForm((f) => ({
                    ...f,
                    linkTargetType: n,
                    articleId: n === 2 ? f.articleId : null,
                    externalUrl: n === 1 ? f.externalUrl : "",
                  }));
                  if (n !== 2) {
                    setPickedArticle(null);
                    setPreviewSlug(null);
                    setTitleSearch("");
                    setTitleResults([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">بدون</SelectItem>
                  <SelectItem value="1">رابط خارجي</SelectItem>
                  <SelectItem value="2">مقال داخلي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
              />
            </div>
          </div>
          {form.linkTargetType === 1 && (
            <div className="space-y-2">
              <Label>الرابط الخارجي</Label>
              <Input
                value={form.externalUrl || ""}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                dir="ltr"
                className="text-left"
              />
            </div>
          )}
          {form.linkTargetType === 2 && (
            <div className="space-y-2">
              <Label>المقال</Label>
              <p className="text-xs text-muted-foreground">
                عند اختيار مقال يُعبّأ تلقائياً العنوان وصورة الخلفية والوصف من المقال (يمكنك تعديلها لاحقاً).
              </p>
              {pickedArticle ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground truncate">{pickedArticle.title}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">
                      {pickedArticle.slug}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setPickedArticle(null);
                      setPreviewSlug(null);
                      setForm((f) => ({ ...f, articleId: null }));
                      setTitleSearch("");
                      setTitleResults([]);
                    }}
                  >
                    تغيير المقال
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    placeholder="ابحث بعنوان المقال (3 أحرف على الأقل)"
                    dir="auto"
                  />
                  {titleSearch.trim().length > 0 && titleSearch.trim().length < TITLE_SEARCH_MIN && (
                    <p className="text-xs text-muted-foreground">أدخل {TITLE_SEARCH_MIN} أحرف على الأقل لبدء البحث.</p>
                  )}
                  {titleSearchLoading && <p className="text-xs text-muted-foreground">جاري البحث…</p>}
                  {!titleSearchLoading && titleSearch.trim().length >= TITLE_SEARCH_MIN && titleResults.length === 0 && (
                    <p className="text-xs text-muted-foreground">لا توجد مقالات مطابقة.</p>
                  )}
                  {titleResults.length > 0 && (
                    <ul className="max-h-52 overflow-y-auto rounded-md border border-border divide-y divide-border bg-background" role="listbox">
                      {titleResults.map((row) => (
                        <li key={row.id}>
                          <button
                            type="button"
                            className="w-full text-right px-3 py-2.5 hover:bg-muted/80 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between gap-2"
                            onClick={() => {
                              const summaryHtml = row.summary?.trim()
                                ? `<p>${escapeHtml(row.summary.trim()).replace(/\n/g, "<br/>")}</p>`
                                : "";
                              setPickedArticle({ id: row.id, title: row.title, slug: row.slug });
                              setPreviewSlug(row.slug);
                              setForm((f) => ({
                                ...f,
                                articleId: row.id,
                                title: row.title,
                                backgroundImageUrl: row.coverImageUrl?.trim() || f.backgroundImageUrl,
                                contentHtml: summaryHtml || f.contentHtml,
                              }));
                              setTitleResults([]);
                              setTitleSearch("");
                            }}
                          >
                            <span className="font-medium text-sm truncate">{row.title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={row.isPublished ? "default" : "secondary"} className="text-xs">
                                {row.isPublished ? "منشور" : "مسودة"}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate max-w-[140px]" dir="ltr">
                                {row.slug}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={form.openInNewTab} onCheckedChange={(v) => setForm((f) => ({ ...f, openInNewTab: v }))} />
            <Label>فتح في نافذة جديدة</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            <Label>نشط</Label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/slider")}>
              إلغاء
            </Button>
          </div>
        </form>

        <Card className="xl:sticky xl:top-4 shrink-0">
          <CardHeader className="py-3">
            <CardTitle className="text-base">معاينة الشريحة</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SliderSlidePreview form={form} articleSlug={previewSlug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
