import { resolveMediaUrl } from "@/lib/api";
import { pickColor, sliderOverlayStyleForm, sliderThemeDefaults } from "@/lib/sliderTheme";
import type { SliderSlideUpsertDto } from "@/lib/types";

type Props = {
  form: SliderSlideUpsertDto;
  /** Slug for internal article link preview (optional). */
  articleSlug: string | null;
};

function stripUnsafeTags(html: string): string {
  return html.replace(/<\/?script[^>]*>/gi, "").replace(/\son\w+\s*=/gi, " data-blocked=");
}

export default function SliderSlidePreview({ form, articleSlug }: Props) {
  const bg = resolveMediaUrl(form.backgroundImageUrl || undefined) || "/placeholder.svg";
  const titleColor = pickColor(form.titleColor, sliderThemeDefaults.titleColor);
  const subtitleText = pickColor(form.subtitleTextColor, sliderThemeDefaults.subtitleTextColor);
  const subBg = pickColor(form.subtitleBadgeBackgroundColor, sliderThemeDefaults.subtitleBadgeBackgroundColor);
  const subBorder = pickColor(form.subtitleBadgeBorderColor, sliderThemeDefaults.subtitleBadgeBorderColor);
  const contentColor = pickColor(form.contentHtmlColor, sliderThemeDefaults.contentHtmlColor);
  const ctaBg = pickColor(form.ctaBackgroundColor, sliderThemeDefaults.ctaBackgroundColor);
  const ctaFg = pickColor(form.ctaTextColor, sliderThemeDefaults.ctaTextColor);

  const btnStyle = { backgroundColor: ctaBg, color: ctaFg } as const;

  const renderCta = () => {
    if (form.linkTargetType === 1 && form.externalUrl?.trim()) {
      return (
        <span className="inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm" style={btnStyle}>
          اقرأ المزيد
        </span>
      );
    }
    if (form.linkTargetType === 2 && articleSlug) {
      return (
        <span className="inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm opacity-95" style={btnStyle} title={articleSlug}>
          اقرأ المزيد
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-[340px] overflow-hidden rounded-xl border border-border shadow-md bg-muted">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bg})` }}>
        <div className="absolute inset-0" style={sliderOverlayStyleForm(form)} />
      </div>
      <div className="relative h-full flex items-center p-4">
        <div className="max-w-[95%] text-start">
          {form.subtitle?.trim() ? (
            <span
              className="inline-block px-3 py-0.5 mb-2 rounded-full text-xs font-medium border"
              style={{
                color: subtitleText,
                backgroundColor: subBg,
                borderColor: subBorder,
              }}
            >
              {form.subtitle}
            </span>
          ) : null}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-3" style={{ color: titleColor }}>
            {form.title?.trim() || "—"}
          </h3>
          {form.contentHtml?.trim() ? (
            <div
              className="mt-2 text-sm line-clamp-4 prose prose-invert max-w-lg [&_p]:my-1 prose-ul:pr-[1.25em] prose-ul:pl-0 prose-ol:pr-[1.25em] prose-ol:pl-0"
              dir="rtl"
              lang="ar"
              style={{ color: contentColor }}
              dangerouslySetInnerHTML={{ __html: stripUnsafeTags(form.contentHtml) }}
            />
          ) : null}
          {renderCta()}
        </div>
      </div>
    </div>
  );
}
