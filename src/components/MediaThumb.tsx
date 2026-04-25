import { resolveMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type MediaThumbProps = {
  url: string | null | undefined;
  alt?: string;
  className?: string;
  size?: "sm" | "md";
};

const sizeClass = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
};

/** Resolves API-relative paths (e.g. `/uploads/...`) for list thumbnails. */
export default function MediaThumb({ url, alt = "", className, size = "md" }: MediaThumbProps) {
  const src = resolveMediaUrl(url);
  if (!src) {
    return <span className="inline-flex items-center justify-center text-muted-foreground text-xs tabular-nums">—</span>;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn(sizeClass[size], "rounded-md object-cover border border-border bg-muted shrink-0", className)}
    />
  );
}
