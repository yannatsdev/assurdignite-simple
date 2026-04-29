import * as React from "react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * DateInput
 * - Desktop: native <input type="date"> picker.
 * - Mobile: text input with jj/mm/aaaa mask + numeric keypad (so users can
 *   type the date directly without fighting the native scroller).
 *
 * `value` and `onChange` always speak ISO `YYYY-MM-DD` for compatibility
 * with the rest of the app (forms, Supabase, actuarial engine).
 */
export interface DateInputProps {
  value: string; // ISO YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  min?: string; // ISO
  max?: string; // ISO
  className?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "aria-label"?: string;
}

const isoToFr = (iso: string): string => {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const frToIso = (fr: string): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd
    .toString()
    .padStart(2, "0")}`;
};

const formatMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length >= 3) parts[1] = digits.slice(2, 4);
  if (digits.length >= 5) parts[2] = digits.slice(4, 8);
  return parts.filter(Boolean).join("/");
};

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, min, max, className, placeholder, ...rest }, ref) => {
    const isMobile = useIsMobile();
    const [text, setText] = React.useState<string>(isoToFr(value));

    React.useEffect(() => {
      // Keep local text in sync when value changes from outside
      setText(isoToFr(value));
    }, [value]);

    if (!isMobile) {
      return (
        <Input
          ref={ref}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className={className}
          {...rest}
        />
      );
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? "jj/mm/aaaa"}
        value={text}
        onChange={(e) => {
          const masked = formatMask(e.target.value);
          setText(masked);
          const iso = frToIso(masked);
          if (iso) onChange(iso);
          else if (masked.length === 0) onChange("");
        }}
        onBlur={() => {
          const iso = frToIso(text);
          if (!iso && text.length > 0) {
            // invalid -> clear
            setText("");
            onChange("");
          }
        }}
        maxLength={10}
        className={cn(className)}
        {...rest}
      />
    );
  },
);
DateInput.displayName = "DateInput";

export default DateInput;
