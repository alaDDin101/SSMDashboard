import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, resolveMediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MEDIA_UPLOAD_PERM = "media.upload";

type ImageUrlFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Hide URL input; only pick file → upload → API returns URL stored in value. */
  uploadOnly?: boolean;
  /** Also allow upload if user has any of these (e.g. slider.manage on slider form). */
  alsoAllowUploadWith?: string[];
};

export default function ImageUrlField({ id, label, value, onChange, disabled, uploadOnly, alsoAllowUploadWith }: ImageUrlFieldProps) {
  const { hasPermission } = useAuth();
  const canUpload =
    hasPermission(MEDIA_UPLOAD_PERM) || (alsoAllowUploadWith?.some((p) => hasPermission(p)) ?? false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
      toast.success("تم رفع الصورة");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const previewSrc = resolveMediaUrl(value);

  if (uploadOnly) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {!canUpload ? (
          <p className="text-sm text-muted-foreground">لا تتوفر صلاحية رفع الوسائط (media.upload).</p>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={disabled}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={disabled || uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "جاري الرفع..." : value ? "تغيير الصورة" : "اختر صورة"}
              </Button>
            </div>
            {previewSrc && (
              <div className="rounded-md border border-border bg-muted/30 p-2 inline-block max-w-full">
                <img src={previewSrc} alt="" className="max-h-48 max-w-full rounded object-contain" />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          dir="ltr"
          className="text-left flex-1 min-w-0"
          placeholder="/uploads/..."
          disabled={disabled}
        />
        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 gap-2"
              disabled={disabled || uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "جاري الرفع..." : "رفع صورة"}
            </Button>
          </>
        )}
      </div>
      {previewSrc && (
        <div className="rounded-md border border-border bg-muted/30 p-2 inline-block max-w-full">
          <img src={previewSrc} alt="" className="max-h-40 max-w-full rounded object-contain" />
        </div>
      )}
    </div>
  );
}
