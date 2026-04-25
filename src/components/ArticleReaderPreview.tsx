import { useMemo } from "react";
import { sanitizeArticleBodyPreview } from "@/lib/articlePreviewHtml";
import { resolveMediaUrl } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  slug: string;
  summary: string | null;
  bodyHtml: string;
  coverImageUrl: string | null;
  className?: string;
};

/** Reader-style preview for article HTML (dashboard). */
export default function ArticleReaderPreview({ title, slug, summary, bodyHtml, coverImageUrl, className }: Props) {
  const safe = useMemo(() => sanitizeArticleBodyPreview(bodyHtml || ""), [bodyHtml]);
  const cover = resolveMediaUrl(coverImageUrl || undefined);

  return (
    <ScrollArea className={cn("h-full max-h-full rounded-lg border border-border bg-background", className)}>
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground mb-4 font-mono" dir="ltr">
          /articles/{slug || "…"}
        </p>
        {cover ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-border aspect-[21/9] max-h-52">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight mb-3">{title || "—"}</h1>
        {summary?.trim() ? (
          <p className="text-muted-foreground text-base leading-relaxed mb-6 border-b border-border pb-6">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic mb-6 border-b border-border pb-6">لا يوجد ملخص</p>
        )}
        <article
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground prose-headings:scroll-mt-20 prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg prose-li:marker:text-muted-foreground prose-ul:pr-[1.625em] prose-ul:pl-0 prose-ol:pr-[1.625em] prose-ol:pl-0"
          dir="rtl"
          lang="ar"
          dangerouslySetInnerHTML={{ __html: safe || "<p class=\"text-muted-foreground\">لا يوجد محتوى بعد.</p>" }}
        />
      </div>
    </ScrollArea>
  );
}
