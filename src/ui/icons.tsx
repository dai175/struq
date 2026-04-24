import type { ReactNode, SVGProps } from "react";

/**
 * Broadcast Console icon set — inline stroke-based SVGs, viewBox 0 0 24 24.
 * Stroke width 1.6–1.8, fill none (except fill-only Play / Drag). Sizes default
 * to 18px for nav/inline, 14px for meta; callers can override via `size` or
 * className. Icons are decorative — they always pair with a visible text
 * label — so every svg carries aria-hidden.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & { size?: number };

interface StrokeProps extends IconProps {
  strokeWidth: number;
  children: ReactNode;
}

function Stroke({ size = 18, strokeWidth, children, ...rest }: StrokeProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

interface FillProps extends IconProps {
  children: ReactNode;
}

function Fill({ size = 14, children, ...rest }: FillProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
      {children}
    </svg>
  );
}

export function IconBack(props: IconProps) {
  return (
    <Stroke size={18} strokeWidth={1.6} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Stroke>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <Fill size={14} {...props}>
      <path d="M6 4l14 8-14 8z" />
    </Fill>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Stroke size={16} strokeWidth={1.6} {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </Stroke>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Stroke size={12} strokeWidth={2.6} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Stroke size={14} strokeWidth={1.8} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Stroke>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Stroke size={14} strokeWidth={1.6} {...props}>
      <path d="M12 3v4M12 17v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 19.8L7 17M17 7l2.8-2.8" />
    </Stroke>
  );
}

export function IconDrag(props: IconProps) {
  return (
    <Fill size={14} {...props}>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </Fill>
  );
}

export function IconExt(props: IconProps) {
  return (
    <Stroke size={14} strokeWidth={1.8} {...props}>
      <path d="M15 3h6v6M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </Stroke>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Stroke size={11} strokeWidth={1.8} {...props}>
      <path d="M12 22s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </Stroke>
  );
}

export function IconCal(props: IconProps) {
  return (
    <Stroke size={11} strokeWidth={1.8} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Stroke>
  );
}

export function IconSetlists(props: IconProps) {
  return (
    <Stroke size={18} strokeWidth={1.8} {...props}>
      <path d="M3 6h18M3 12h12M3 18h8M19 15l4 3-4 3z" />
    </Stroke>
  );
}

export function IconSongs(props: IconProps) {
  return (
    <Stroke size={18} strokeWidth={1.8} {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Stroke>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Stroke size={18} strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8L6.3 17.7M17.7 6.3l2.1-2.1" />
    </Stroke>
  );
}

interface LogomarkProps {
  size?: number;
}

/**
 * Logomark — 5 colored rects in a 3-row structure chart, echoing a song's
 * section layout. Fills reference the section palette so any later palette
 * retune keeps the logo in sync.
 */
export function Logomark({ size = 26 }: LogomarkProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <rect x="2" y="4" width="6" height="3" fill="var(--color-section-intro)" />
      <rect x="10" y="4" width="8" height="3" fill="var(--color-section-a)" />
      <rect x="2" y="10" width="12" height="3" fill="var(--color-section-chorus)" />
      <rect x="2" y="16" width="5" height="3" fill="var(--color-section-bridge)" />
      <rect x="9" y="16" width="11" height="3" fill="var(--color-section-solo)" />
    </svg>
  );
}
