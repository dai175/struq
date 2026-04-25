import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useState } from "react";
import { logout, requireAuth, updateLocale } from "@/auth/server-fns";
import type { SessionUser } from "@/auth/session";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useClickPreference } from "@/songs/click-preference";
import { ConsoleBtn } from "@/ui/console-btn";
import { MetaTag } from "@/ui/meta-tag";
import { Toggle } from "@/ui/toggle";
import { TopBar } from "@/ui/top-bar";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

type ClickSound = "TICK" | "BEEP" | "SNAP" | "RIM";
type Appearance = "DARK" | "AUTO" | "LIGHT";
type PreRoll = 0 | 1 | 2 | 4;

const CLICK_SOUNDS: ClickSound[] = ["TICK", "BEEP", "SNAP", "RIM"];
const APPEARANCES: Appearance[] = ["DARK", "AUTO", "LIGHT"];
const PRE_ROLL_OPTIONS: PreRoll[] = [0, 1, 2, 4];

const validateBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const validateClickVolume = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
const validateClickSound = (v: unknown): ClickSound | null =>
  typeof v === "string" && (CLICK_SOUNDS as readonly string[]).includes(v) ? (v as ClickSound) : null;
const validatePreRoll = (v: unknown): PreRoll | null =>
  (PRE_ROLL_OPTIONS as readonly number[]).includes(v as number) ? (v as PreRoll) : null;
const validateAppearance = (v: unknown): Appearance | null =>
  typeof v === "string" && (APPEARANCES as readonly string[]).includes(v) ? (v as Appearance) : null;

type PcNavId = "account" | "language" | "audio" | "appearance" | "shortcuts" | "about";

interface PcNavItem {
  id: PcNavId;
  label: string;
  subtitle: string;
}

// Stylistic mono labels + subtitles stay English by design (Broadcast Console
// aesthetic — JetBrains Mono, wide letter-spacing, uppercase). Only the prose
// "title" shown in PcTopRail is translated via t.settings.nav*.
const PC_NAV: PcNavItem[] = [
  { id: "account", label: "ACCOUNT", subtitle: "PROFILE · SESSION · SIGN-OUT" },
  { id: "language", label: "LANGUAGE", subtitle: "DISPLAY LOCALE" },
  { id: "audio", label: "AUDIO & CLICK", subtitle: "METRONOME · COUNT-IN · SOUND" },
  { id: "appearance", label: "APPEARANCE", subtitle: "THEME · DENSITY" },
  { id: "shortcuts", label: "SHORTCUTS", subtitle: "KEYBOARD · GESTURES" },
  { id: "about", label: "ABOUT", subtitle: "VERSION · CHANNEL · CREDITS" },
];

function initials(name: string | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const logoutFn = useServerFn(logout);
  const updateLocaleFn = useServerFn(updateLocale);
  const [localeUpdating, setLocaleUpdating] = useState(false);
  const [clickEnabled, setClickEnabled] = useClickPreference();

  const [countIn, setCountIn] = usePersistedState("struq.settings.countIn", false, validateBool);
  const [clickVolume, setClickVolume] = usePersistedState("struq.settings.clickVolume", 62, validateClickVolume);
  const [clickSound, setClickSound] = usePersistedState<ClickSound>(
    "struq.settings.clickSound",
    "TICK",
    validateClickSound,
  );
  const [accentDownbeat, setAccentDownbeat] = usePersistedState("struq.settings.accentDownbeat", true, validateBool);
  const [preRollBars, setPreRollBars] = usePersistedState<PreRoll>("struq.settings.preRollBars", 0, validatePreRoll);
  const [appearance, setAppearance] = usePersistedState<Appearance>(
    "struq.settings.appearance",
    "DARK",
    validateAppearance,
  );

  const [activeNav, setActiveNav] = useState<PcNavId>("account");
  const activeMeta = PC_NAV.find((n) => n.id === activeNav) ?? PC_NAV[0];
  const navTitles: Record<PcNavId, string> = {
    account: t.settings.nav.account,
    language: t.settings.nav.language,
    audio: t.settings.nav.audio,
    appearance: t.settings.nav.appearance,
    shortcuts: t.settings.nav.shortcuts,
    about: t.settings.nav.about,
  };

  const handleLogout = async () => {
    try {
      await logoutFn();
      router.navigate({ to: "/login" });
    } catch (error) {
      clientLogger.error("logout", error);
    }
  };

  const handleLocaleChange = async (newLocale: Locale) => {
    if (localeUpdating || newLocale === locale) return;
    setLocaleUpdating(true);
    setLocale(newLocale);
    try {
      await updateLocaleFn({ data: { locale: newLocale } });
    } catch (error) {
      clientLogger.error("updateLocale", error);
      setLocale(locale);
    } finally {
      setLocaleUpdating(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* PC layout (≥lg). SideRail is rendered globally by __root. */}
      <div className="hidden lg:flex lg:min-h-screen">
        <PcSubNav active={activeNav} onChange={setActiveNav} />
        <main className="flex min-w-0 flex-1 flex-col">
          <PcTopRail title={navTitles[activeMeta.id]} subtitle={activeMeta.subtitle} />
          <div className="flex-1 overflow-auto" style={{ padding: "28px 36px" }}>
            {activeNav === "account" && (
              <PcAccountSection user={user} onLogout={handleLogout} signOutLabel={t.nav.logout} />
            )}
            {activeNav === "language" && (
              <PcLanguageSection locale={locale} updating={localeUpdating} onChange={handleLocaleChange} />
            )}
            {activeNav === "audio" && (
              <PcAudioSection
                clickEnabled={clickEnabled}
                onClickEnabled={setClickEnabled}
                countIn={countIn}
                onCountIn={setCountIn}
                clickVolume={clickVolume}
                onClickVolume={setClickVolume}
                clickSound={clickSound}
                onClickSound={setClickSound}
                accentDownbeat={accentDownbeat}
                onAccentDownbeat={setAccentDownbeat}
                preRollBars={preRollBars}
                onPreRollBars={setPreRollBars}
              />
            )}
            {activeNav === "appearance" && <PcAppearanceSection appearance={appearance} onAppearance={setAppearance} />}
            {activeNav === "shortcuts" && <PcShortcutsSection />}
            {activeNav === "about" && <PcAboutSection />}
          </div>
        </main>
      </div>

      {/* Mobile layout (<lg) */}
      <div className="mx-auto max-w-2xl lg:hidden">
        <TopBar
          title={t.nav.settings}
          subtitle="ACCOUNT · PREFERENCES · ABOUT"
          left={<MetaTag>STRUQ</MetaTag>}
          right={<MetaTag>V 2.0</MetaTag>}
        />

        {/* Identity row */}
        <div
          className="flex items-center gap-4"
          style={{
            padding: "20px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 48,
              background: "var(--color-accent)",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
              {user?.name ?? "—"}
            </div>
            <div
              className="truncate"
              style={{
                marginTop: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
              }}
            >
              {user?.email ?? ""}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid var(--color-line-2)",
              color: "var(--color-section-solo)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            {t.nav.logout}
          </button>
        </div>

        {/* 01 LANGUAGE */}
        <Section number="01" title="LANGUAGE">
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map((l) => {
              const active = locale === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLocaleChange(l)}
                  disabled={localeUpdating}
                  style={{
                    padding: "14px",
                    border: active ? "1px solid var(--color-text)" : "1px solid var(--color-line)",
                    background: active ? "rgba(255,255,255,0.05)" : "transparent",
                    color: active ? "#fff" : "var(--color-text)",
                    cursor: localeUpdating ? "not-allowed" : "pointer",
                    opacity: localeUpdating ? 0.5 : 1,
                    textAlign: "left",
                    borderRadius: 1,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: active ? "var(--color-accent)" : "var(--color-dim)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {l.toUpperCase()}
                    {active && " · ACTIVE"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{LOCALE_LABELS[l]}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 02 AUDIO & CLICK */}
        <Section number="02" title="AUDIO & CLICK">
          <div className="flex flex-col gap-2.5">
            <SettingRow
              label="CLICK TRACK"
              description={t.settings.desc.clickTrack}
              control={<Toggle on={clickEnabled} onChange={setClickEnabled} ariaLabel={t.settings.aria.clickTrack} />}
            />
            <SettingRow
              label="COUNT-IN"
              description={t.settings.desc.countIn}
              control={<Toggle on={countIn} onChange={setCountIn} ariaLabel={t.settings.aria.countIn} />}
            />
            <SettingRow
              label="CLICK VOLUME"
              description={null}
              right={
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    letterSpacing: "0.15em",
                  }}
                >
                  {String(clickVolume).padStart(3, "0")}
                </span>
              }
            >
              <div className="mt-3">
                <VolumeSlider value={clickVolume} onChange={setClickVolume} ariaLabel={t.settings.aria.clickVolume} />
                <div
                  className="mt-1.5 flex justify-between"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "var(--color-dim-2)",
                    fontWeight: 500,
                  }}
                >
                  <span>000</span>
                  <span>100</span>
                </div>
              </div>
            </SettingRow>
            <SettingRow label="CLICK SOUND" description={t.settings.desc.clickSoundChar}>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {CLICK_SOUNDS.map((s) => (
                  <ChoiceCard key={s} label={s} active={clickSound === s} onClick={() => setClickSound(s)} />
                ))}
              </div>
            </SettingRow>
            <SettingRow
              label="ACCENT DOWNBEAT"
              description={t.settings.desc.accentDownbeat}
              control={
                <Toggle on={accentDownbeat} onChange={setAccentDownbeat} ariaLabel={t.settings.aria.accentDownbeat} />
              }
            />
            <SettingRow label="PRE-ROLL BARS" description={t.settings.desc.preRoll}>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {PRE_ROLL_OPTIONS.map((n) => (
                  <ChoiceCard key={n} label={String(n)} active={preRollBars === n} onClick={() => setPreRollBars(n)} />
                ))}
              </div>
            </SettingRow>
          </div>
        </Section>

        {/* 03 APPEARANCE */}
        <Section number="03" title="APPEARANCE">
          <div className="grid grid-cols-3 gap-2">
            {APPEARANCES.map((a) => (
              <ChoiceCard key={a} label={a} active={appearance === a} onClick={() => setAppearance(a)} size="large" />
            ))}
          </div>
        </Section>

        {/* 04 ABOUT */}
        <Section number="04" title="ABOUT" last>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {(
              [
                ["VERSION", __APP_VERSION__],
                ["RELEASED", "2026.04.22"],
                ["CHANNEL", "Stable"],
                ["MADE BY", "focuswave"],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <MetaTag size={11} style={{ letterSpacing: "0.2em", color: "var(--color-dim)" }}>
                  {k}
                </MetaTag>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
  last = false,
}: {
  number: string;
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section
      style={{
        padding: "18px",
        borderBottom: last ? undefined : "1px solid var(--color-line)",
      }}
    >
      <MetaTag>
        {number} · {title}
      </MetaTag>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  control,
  right,
  children,
}: {
  label: string;
  description?: string | null;
  control?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px",
        border: "1px solid var(--color-line)",
        borderRadius: 1,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "#fff",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          {description && (
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--color-dim)",
              }}
            >
              {description}
            </div>
          )}
        </div>
        {control && <div className="shrink-0">{control}</div>}
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({
  label,
  active,
  onClick,
  size = "small",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "small" | "large";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: size === "large" ? "18px 12px" : "12px 10px",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        border: active ? "1px solid #fff" : "1px solid var(--color-line)",
        color: active ? "#fff" : "var(--color-dim)",
        fontFamily: "var(--font-mono)",
        fontSize: size === "large" ? 12 : 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: 2,
      }}
    >
      {label}
    </button>
  );
}

/**
 * Mobile click-volume slider — keeps a native <input type="range"> beneath
 * a custom track/fill/handle for keyboard + screen reader support, while the
 * visual matches the broadcast-console handoff (4px track, accent fill,
 * 2×12 white handle).
 */
function VolumeSlider({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div style={{ position: "relative", height: 12, display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value}%`,
            background: "var(--color-accent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${value}%`,
            top: -4,
            width: 2,
            height: 12,
            background: "#fff",
            transform: "translateX(-1px)",
            pointerEvents: "none",
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          opacity: 0,
          cursor: "pointer",
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <MetaTag size={10}>{label}</MetaTag>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "#fff",
          letterSpacing: "0.04em",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── PC primitives ──────────────────────────────────────────────────────────

function PcSubNav({ active, onChange }: { active: PcNavId; onChange: (id: PcNavId) => void }) {
  const { t } = useI18n();
  return (
    <aside
      className="flex flex-col"
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid var(--color-line)",
        padding: "18px 0",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ padding: "0 22px 18px", borderBottom: "1px solid var(--color-line)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{t.settings.title}</div>
        <div style={{ marginTop: 3 }}>
          <MetaTag size={9}>SYSTEM &amp; PREFERENCES</MetaTag>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {PC_NAV.map((item) => (
          <PcSubNavItem key={item.id} item={item} active={item.id === active} onClick={() => onChange(item.id)} />
        ))}
      </div>
    </aside>
  );
}

function PcSubNavItem({ item, active, onClick }: { item: PcNavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 22px",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? "#fff" : "var(--color-dim)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.22em",
        fontWeight: active ? 600 : 400,
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        borderWidth: 0,
        borderLeftWidth: 2,
        borderLeftStyle: "solid",
        borderLeftColor: active ? "var(--color-accent)" : "transparent",
      }}
    >
      <span>{item.label}</span>
      {active && (
        <span aria-hidden="true" style={{ color: "var(--color-accent)" }}>
          ●
        </span>
      )}
    </button>
  );
}

function PcTopRail({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: "14px 28px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="truncate"
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#fff",
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 3 }}>
          <MetaTag size={10}>{subtitle}</MetaTag>
        </div>
      </div>
    </div>
  );
}

function PcSettingRow({
  label,
  desc,
  span = 1,
  children,
}: {
  label: string;
  desc?: string;
  span?: 1 | 2;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        gridColumn: span === 2 ? "span 2" : undefined,
        padding: "20px 22px",
        border: "1px solid var(--color-line)",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 20, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "#fff",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          {desc && <div style={{ marginTop: 5, fontSize: 13, color: "var(--color-dim)" }}>{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function PcSoundCard({
  label,
  desc,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: "14px 14px",
        textAlign: "left",
        border: active ? "1px solid var(--color-text)" : "1px solid var(--color-line)",
        background: "rgba(255,255,255,0.02)",
        cursor: "pointer",
        borderRadius: 1,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.22em",
          color: active ? "var(--color-accent)" : "var(--color-dim)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-dim)" }}>{desc}</div>
    </button>
  );
}

function PcPreRollChip({ value, active, onClick }: { value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: "10px 14px",
        border: active ? "1px solid var(--color-text)" : "1px solid var(--color-line)",
        background: active ? "rgba(255,255,255,0.05)" : "transparent",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.08em",
        fontWeight: 600,
        color: active ? "var(--color-accent)" : "var(--color-dim)",
        cursor: "pointer",
        borderRadius: 1,
      }}
    >
      {value}
    </button>
  );
}

/**
 * PC volume slider — keeps a native <input type="range"> beneath a custom
 * track/fill/handle for keyboard + screen reader support, while the visual
 * matches the broadcast-console handoff (4px track, accent fill, 2×14 handle).
 */
function PcVolumeSlider({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center" style={{ gap: 16 }}>
        <div
          className="pc-volume-slider"
          style={{ position: "relative", flex: 1, height: 14, display: "flex", alignItems: "center" }}
        >
          <div
            style={{
              width: "100%",
              height: 4,
              background: "rgba(255,255,255,0.08)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${value}%`,
                background: "var(--color-accent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${value}%`,
                top: -5,
                width: 2,
                height: 14,
                background: "#fff",
                transform: "translateX(-1px)",
                pointerEvents: "none",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={ariaLabel}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              opacity: 0,
              cursor: "pointer",
              margin: 0,
              padding: 0,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-accent)",
            letterSpacing: "0.08em",
            width: 50,
            textAlign: "right",
          }}
        >
          {String(value).padStart(3, "0")}
        </div>
      </div>
      <div
        className="flex justify-between"
        style={{
          marginTop: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--color-dim-2)",
        }}
      >
        <span>000 · MUTE</span>
        <span>050</span>
        <span>100 · MAX</span>
      </div>
    </div>
  );
}

// ─── PC sections ────────────────────────────────────────────────────────────

function PcAccountSection({
  user,
  onLogout,
  signOutLabel,
}: {
  user: SessionUser | null;
  onLogout: () => void;
  signOutLabel: string;
}) {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="PROFILE" desc={t.settings.desc.profile} span={2}>
        <div className="flex items-center" style={{ gap: 20 }}>
          <div
            aria-hidden="true"
            style={{
              width: 64,
              height: 64,
              background: "var(--color-accent)",
              color: "#0b0b0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate" style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
              {user?.name ?? "—"}
            </div>
            <div
              className="truncate"
              style={{
                marginTop: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
              }}
            >
              {user?.email ?? ""}
            </div>
          </div>
        </div>
      </PcSettingRow>
      <PcSettingRow label="SESSION" desc={t.settings.desc.session} span={2}>
        <ConsoleBtn tone="coral" onClick={onLogout}>
          {signOutLabel.toUpperCase()}
        </ConsoleBtn>
      </PcSettingRow>
    </div>
  );
}

function PcLanguageSection({
  locale,
  updating,
  onChange,
}: {
  locale: Locale;
  updating: boolean;
  onChange: (locale: Locale) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="DISPLAY LOCALE" desc={t.settings.desc.locale} span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LOCALES.map((l) => {
            const active = locale === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => onChange(l)}
                disabled={updating}
                style={{
                  padding: "16px 14px",
                  textAlign: "left",
                  border: active ? "1px solid #fff" : "1px solid var(--color-line)",
                  background: active ? "rgba(255,255,255,0.04)" : "transparent",
                  color: active ? "#fff" : "var(--color-text)",
                  cursor: updating ? "not-allowed" : "pointer",
                  opacity: updating ? 0.5 : 1,
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    color: active ? "var(--color-accent)" : "var(--color-dim-2)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {l.toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{LOCALE_LABELS[l]}</div>
              </button>
            );
          })}
        </div>
      </PcSettingRow>
    </div>
  );
}

function PcAudioSection({
  clickEnabled,
  onClickEnabled,
  countIn,
  onCountIn,
  clickVolume,
  onClickVolume,
  clickSound,
  onClickSound,
  accentDownbeat,
  onAccentDownbeat,
  preRollBars,
  onPreRollBars,
}: {
  clickEnabled: boolean;
  onClickEnabled: (v: boolean) => void;
  countIn: boolean;
  onCountIn: (v: boolean) => void;
  clickVolume: number;
  onClickVolume: (v: number) => void;
  clickSound: ClickSound;
  onClickSound: (v: ClickSound) => void;
  accentDownbeat: boolean;
  onAccentDownbeat: (v: boolean) => void;
  preRollBars: PreRoll;
  onPreRollBars: (v: PreRoll) => void;
}) {
  const { t } = useI18n();
  const clickSoundDescs: Record<ClickSound, string> = {
    TICK: t.settings.soundDesc.tick,
    BEEP: t.settings.soundDesc.beep,
    SNAP: t.settings.soundDesc.snap,
    RIM: t.settings.soundDesc.rim,
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="CLICK TRACK" desc={t.settings.desc.clickTrack}>
        <Toggle on={clickEnabled} onChange={onClickEnabled} ariaLabel={t.settings.aria.clickTrack} />
      </PcSettingRow>
      <PcSettingRow label="COUNT-IN" desc={t.settings.desc.countIn}>
        <Toggle on={countIn} onChange={onCountIn} ariaLabel={t.settings.aria.countIn} />
      </PcSettingRow>
      <PcSettingRow label="CLICK VOLUME" desc={t.settings.desc.clickVolume} span={2}>
        <PcVolumeSlider value={clickVolume} onChange={onClickVolume} ariaLabel={t.settings.aria.clickVolume} />
      </PcSettingRow>
      <PcSettingRow label="CLICK SOUND" desc={t.settings.desc.clickSoundChar} span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {CLICK_SOUNDS.map((s) => (
            <PcSoundCard
              key={s}
              label={s}
              desc={clickSoundDescs[s]}
              active={clickSound === s}
              onClick={() => onClickSound(s)}
            />
          ))}
        </div>
      </PcSettingRow>
      <PcSettingRow label="ACCENT DOWNBEAT" desc={t.settings.desc.accentDownbeat}>
        <Toggle on={accentDownbeat} onChange={onAccentDownbeat} ariaLabel={t.settings.aria.accentDownbeat} />
      </PcSettingRow>
      <PcSettingRow label="PRE-ROLL BARS" desc={t.settings.desc.preRoll}>
        <div style={{ display: "flex", gap: 4 }}>
          {PRE_ROLL_OPTIONS.map((n) => (
            <PcPreRollChip key={n} value={n} active={preRollBars === n} onClick={() => onPreRollBars(n)} />
          ))}
        </div>
      </PcSettingRow>
    </div>
  );
}

function PcAppearanceSection({
  appearance,
  onAppearance,
}: {
  appearance: Appearance;
  onAppearance: (v: Appearance) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="THEME" desc={t.settings.desc.theme} span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {APPEARANCES.map((a) => {
            const active = appearance === a;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() => onAppearance(a)}
                style={{
                  padding: "18px 12px",
                  background: active ? "rgba(255,255,255,0.04)" : "transparent",
                  border: active ? "1px solid #fff" : "1px solid var(--color-line)",
                  color: active ? "#fff" : "var(--color-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                {a}
              </button>
            );
          })}
        </div>
      </PcSettingRow>
    </div>
  );
}

function PcShortcutsSection() {
  const { t } = useI18n();
  const shortcuts = [
    { keys: "SPACE", label: t.settings.shortcut.advance },
    { keys: "◁", label: t.settings.shortcut.previous },
    { keys: "R", label: t.settings.shortcut.reset },
    { keys: "ESC", label: t.settings.shortcut.exit },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="KEYBOARD" desc={t.settings.desc.keyboard} span={2}>
        <div className="flex flex-col">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between"
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--color-line)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--color-dim)",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  border: "1px solid var(--color-line-2)",
                  borderRadius: 2,
                }}
              >
                {s.keys}
              </span>
            </div>
          ))}
        </div>
      </PcSettingRow>
    </div>
  );
}

function PcAboutSection() {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="BUILD" desc={t.settings.desc.build} span={2}>
        <div className="flex flex-col">
          <AboutRow label="VERSION" value="2.0.0" />
          <AboutRow label="RELEASED" value="2026.04.22" />
          <AboutRow label="CHANNEL" value="STABLE" />
          <AboutRow label="MADE BY" value="FOCUSWAVE" />
        </div>
      </PcSettingRow>
    </div>
  );
}
