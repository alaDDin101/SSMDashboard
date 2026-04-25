import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AboutUsSettingsDto, AboutUsUpsertDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ImageUrlField from "@/components/ImageUrlField";
import { ArticleRichEditor } from "@/components/ArticleRichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const picker = /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : "#2d5a27";
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={picker}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
        />
        <Input
          dir="ltr"
          className="max-w-xs font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB أو اتركه فارغاً"
        />
      </div>
    </div>
  );
}

export default function AboutUsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AboutUsUpsertDto>({
    title: "من نحن",
    leadText: null,
    bodyHtml: "",
    imageUrl: null,
    isVisible: true,
    sectionBackgroundColor: null,
    cardBackgroundColor: null,
    accentColor: null,
    headingTextColor: null,
    bodyTextColor: null,
    mutedTextColor: null,
  });

  useEffect(() => {
    setLoading(true);
    api
      .get<AboutUsSettingsDto>("/about")
      .then((d) => {
        setForm({
          title: d.title,
          leadText: d.leadText,
          bodyHtml: d.bodyHtml,
          imageUrl: d.imageUrl,
          isVisible: d.isVisible,
          sectionBackgroundColor: d.sectionBackgroundColor,
          cardBackgroundColor: d.cardBackgroundColor,
          accentColor: d.accentColor,
          headingTextColor: d.headingTextColor,
          bodyTextColor: d.bodyTextColor,
          mutedTextColor: d.mutedTextColor,
        });
      })
      .catch(() => toast.error("تعذّر تحميل الإعدادات"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("أدخل العنوان");
      return;
    }
    if (!form.bodyHtml.trim()) {
      toast.error("أدخل محتوى القسم");
      return;
    }
    setSaving(true);
    try {
      await api.put<AboutUsSettingsDto>("/about", {
        ...form,
        title: form.title.trim(),
        leadText: form.leadText?.trim() || null,
        bodyHtml: form.bodyHtml.trim(),
        imageUrl: form.imageUrl?.trim() || null,
        sectionBackgroundColor: form.sectionBackgroundColor?.trim() || null,
        cardBackgroundColor: form.cardBackgroundColor?.trim() || null,
        accentColor: form.accentColor?.trim() || null,
        headingTextColor: form.headingTextColor?.trim() || null,
        bodyTextColor: form.bodyTextColor?.trim() || null,
        mutedTextColor: form.mutedTextColor?.trim() || null,
      });
      toast.success("تم حفظ «من نحن»");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <PageHeader title="من نحن" backTo="/" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>المحتوى والصورة</CardTitle>
            <CardDescription>يظهر القسم في الصفحة الرئيسية عند التفعيل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.isVisible} onCheckedChange={(v) => setForm((f) => ({ ...f, isVisible: v }))} />
                <Label>إظهار القسم في الموقع</Label>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>مقدمة قصيرة (اختياري)</Label>
              <Input
                value={form.leadText || ""}
                onChange={(e) => setForm((f) => ({ ...f, leadText: e.target.value || null }))}
                placeholder="سطر يظهر تحت العنوان…"
              />
            </div>
            <ImageUrlField label="صورة القسم" value={form.imageUrl || ""} onChange={(v) => setForm((f) => ({ ...f, imageUrl: v || null }))} />
            <div className="space-y-2">
              <Label>نص القسم</Label>
              <ArticleRichEditor
                value={form.bodyHtml}
                onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))}
                className="min-h-[360px]"
                placeholder="اكتب نبذة عن الحركة…"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الألوان (اختياري)</CardTitle>
            <CardDescription>
              اترك الحقل فارغاً لاستخدام ألوان الموقع الافتراضية المستوحاة من الشعار (primary / secondary / card).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <ColorField
              label="خلفية القسم"
              hint="لون خلفية الشريط الكامل."
              value={form.sectionBackgroundColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, sectionBackgroundColor: v.trim() || null }))}
            />
            <ColorField
              label="خلفية البطاقة"
              hint="صندوق المحتوى الداخلي."
              value={form.cardBackgroundColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, cardBackgroundColor: v.trim() || null }))}
            />
            <ColorField
              label="لون التمييز"
              hint="الحدّ الجانبي والعناصر البارزة."
              value={form.accentColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, accentColor: v.trim() || null }))}
            />
            <ColorField
              label="لون العنوان"
              hint="عنوان «من نحن»."
              value={form.headingTextColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, headingTextColor: v.trim() || null }))}
            />
            <ColorField
              label="لون المقدمة"
              hint="السطر التمهيدي تحت العنوان."
              value={form.mutedTextColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, mutedTextColor: v.trim() || null }))}
            />
            <ColorField
              label="لون نص المحتوى"
              hint="النص الغني داخل القسم."
              value={form.bodyTextColor || ""}
              onChange={(v) => setForm((f) => ({ ...f, bodyTextColor: v.trim() || null }))}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? "جاري الحفظ…" : "حفظ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
