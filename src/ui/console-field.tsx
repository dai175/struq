import type { InputHTMLAttributes, ReactNode } from "react";

interface ConsoleFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: ReactNode;
  value: string;
  onChange?: (next: string) => void;
  /** Treat the value as monospace (BPM, Key, URLs, chord progressions). */
  mono?: boolean;
  required?: boolean;
  /** Read-only variant (renders as a styled div, not an input). */
  readOnly?: boolean;
}

/**
 * ConsoleField — dark input with a JBM meta label above.
 * When the value is populated, the left border thickens to 2px accent —
 * a subtle broadcast-console "active channel" cue carried throughout editors.
 */
export function ConsoleField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  required = false,
  readOnly = false,
  ...rest
}: ConsoleFieldProps) {
  const hasValue = value.length > 0;
  const fieldStyle = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-line)",
    borderLeft: hasValue ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
    padding: "12px 14px",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
    fontSize: 14,
    fontWeight: mono ? 500 : 400,
    letterSpacing: mono ? "0.08em" : 0,
    color: hasValue ? "var(--color-text-strong)" : "var(--color-dim-2)",
    width: "100%",
    outline: "none",
    borderRadius: 0,
  } as const;

  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.25em",
          color: "var(--color-dim-2)",
          marginBottom: 8,
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-section-solo)", marginLeft: 4 }}>*</span>}
      </div>
      <input
        {...rest}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly || !onChange}
        style={fieldStyle}
      />
    </label>
  );
}
