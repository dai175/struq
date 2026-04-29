import { MetaTag } from "@/ui/meta-tag";

export function StageCard({
  label,
  right,
  tone = "default",
  children,
}: {
  label: string;
  right?: string;
  tone?: "default" | "dim";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        background: tone === "dim" ? "transparent" : "var(--color-bg-elevated)",
        padding: "12px 14px",
      }}
    >
      <div className="flex items-center justify-between">
        <MetaTag size={10}>{label}</MetaTag>
        {right && <MetaTag size={9}>{right}</MetaTag>}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}
