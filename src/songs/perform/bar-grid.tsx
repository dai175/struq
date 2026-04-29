export function BarGrid({
  total,
  currentBar,
  color,
  tracking,
}: {
  total: number;
  currentBar: number;
  color: string;
  tracking: boolean;
}) {
  return (
    <div
      className="mt-4 grid"
      style={{
        gridTemplateColumns: `repeat(${Math.min(total, 16)}, minmax(0, 1fr))`,
        gap: 4,
        width: "100%",
        maxWidth: 420,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => {
        const active = tracking && i === currentBar;
        const past = tracking && i < currentBar;
        const filled = active || past || !tracking;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, never reordered
            key={i}
            style={{
              height: 18,
              background: filled ? color : "transparent",
              border: `1px solid ${color}`,
              opacity: active ? 1 : past ? 0.7 : tracking ? 0.25 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
