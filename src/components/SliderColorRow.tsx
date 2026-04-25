import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  value: string;
  onChange: (hexOrCss: string) => void;
  hint?: string;
};

const isHex6 = (s: string) => /^#[0-9A-Fa-f]{6}$/.test(s.trim());

/** Color picker + optional hex/rgba text (dashboard slider theme). */
export default function SliderColorRow({ label, value, onChange, hint }: Props) {
  const pickerValue = isHex6(value) ? value : "#ffffff";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
        <input
          type="color"
          aria-label={label}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-background p-0.5"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Input
        dir="ltr"
        className="text-xs font-mono h-8"
        placeholder="#hex أو rgba(...)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p> : null}
    </div>
  );
}
