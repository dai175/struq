import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useState } from "react";
import { logout, requireAuth, updateLocale } from "@/auth/server-fns";
import type { SessionUser } from "@/auth/session";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useClickPreference } from "@/songs/click-preference";
import { ConsoleBtn } from "@/ui/console-btn";
import { MetaTag } from "@/ui/meta-tag";
import { Toggle } from "@/ui/toggle";

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

const CLICK_SOUND_DESCRIPTIONS: Record<ClickSound, string> = {
  TICK: "sharp, wood",
  BEEP: "sine tone",
  SNAP: "analog click",
  RIM: "drum rim",
};

type PcNavId = "account" | "language" | "audio" | "appearance" | "shortcuts" | "about";

interface PcNavItem {
  id: PcNavId;
  label: string;
  title: string;
  subtitle: string;
}

const PC_NAV: PcNavItem[] = [
  { id: "account", label: "ACCOUNT", title: "Account", subtitle: "PROFILE · SESSION · SIGN-OUT" },
  { id: "language", label: "LANGUAGE", title: "Language", subtitle: "DISPLAY LOCALE" },
  { id: "audio", label: "AUDIO & CLICK", title: "Audio & Click", subtitle: "METRONOME · COUNT-IN · SOUND" },
  { id: "appearance", label: "APPEARANCE", title: "Appearance", subtitle: "THEME · DENSITY" },
  { id: "shortcuts", label: "SHORTCUTS", title: "Shortcuts", subtitle: "KEYBOARD · GESTURES" },
  { id: "about", label: "ABOUT", title: "About", subtitle: "VERSION · CHANNEL · CREDITS" },
];

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "SPACE", label: "Advance one bar (Perform)" },
  { keys: "◁", label: "Previous bar (Perform)" },
  { keys: "R", label: "Reset to section 01 (Perform)" },
  { keys: "ESC", label: "Exit Perform mode" },
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
  const { toast } = useToast();
  const logoutFn = useServerFn(logout);
  const updateLocaleFn = useServerFn(updateLocale);
  const [localeUpdating, setLocaleUpdating] = useState(false);
  const [clickEnabled, setClickEnabled] = useClickPreference();

  // New settings — UI-only (not persisted); matches the broadcast spec
  // until a user_settings table lands in a follow-up PR.
  const [countIn, setCountIn] = useState(false);
  const [clickVolume, setClickVolume] = useState(62);
  const [clickSound, setClickSound] = useState<ClickSound>("TICK");
  const [accentDownbeat, setAccentDownbeat] = useState(true);
  const [preRollBars, setPreRollBars] = useState<PreRoll>(0);
  const [appearance, setAppearance] = useState<Appearance>("DARK");

  const [activeNav, setActiveNav] = useState<PcNavId>("account");
  const activeMeta = PC_NAV.find((n) => n.id === activeNav) ?? PC_NAV[0];

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

  const handleApplyChanges = () => {
    toast.success(t.settings.applied);
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
          <PcTopRail title={activeMeta.title} subtitle={activeMeta.subtitle} onApply={handleApplyChanges} />
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
                clickAriaLabel={t.settings.clickSound}
                clickDescription={t.settings.clickSoundDescription}
              />
            )}
            {activeNav === "appearance" && <PcAppearanceSection appearance={appearance} onAppearance={setAppearance} />}
            {activeNav === "shortcuts" && <PcShortcutsSection />}
            {activeNav === "about" && <PcAboutSection />}
          </div>
        </main>
      </div>

      {/* Mobile layout (<lg) */}
      <div className="mx-auto max-w-2xl px-5 pt-6 pb-10 lg:hidden">
        <header className="pb-6">
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#fff",
            }}
          >
            {t.nav.settings}
          </h1>
          <div className="mt-1.5">
            <MetaTag>ACCOUNT · PREFERENCES · ABOUT</MetaTag>
          </div>
        </header>

        {/* Identity row */}
        <div
          className="flex items-center gap-4"
          style={{
            padding: "18px",
            border: "1px solid var(--color-line)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 48,
              background: "var(--color-accent)",
              color: "#0b0b0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
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
                color: "var(--color-dim-2)",
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
              border: "1px solid var(--color-section-solo)",
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
                    padding: "16px 14px",
                    border: active ? "1px solid #fff" : "1px solid var(--color-line)",
                    background: active ? "rgba(255,255,255,0.04)" : "transparent",
                    color: active ? "#fff" : "var(--color-text)",
                    cursor: localeUpdating ? "not-allowed" : "pointer",
                    opacity: localeUpdating ? 0.5 : 1,
                    textAlign: "left",
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
        </Section>

        {/* 02 AUDIO & CLICK */}
        <Section number="02" title="AUDIO & CLICK">
          <div className="flex flex-col">
            <SettingRow
              label="CLICK TRACK"
              description={t.settings.clickSoundDescription}
              control={<Toggle on={clickEnabled} onChange={setClickEnabled} ariaLabel={t.settings.clickSound} />}
            />
            <SettingRow
              label="COUNT-IN"
              description="Play a 4-beat count-in before sections start."
              control={<Toggle on={countIn} onChange={setCountIn} ariaLabel="Count-in" />}
            />
            <SettingRow
              label="CLICK VOLUME"
              description={null}
              right={
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {String(clickVolume).padStart(3, "0")}
                </span>
              }
            >
              <div className="mt-3">
                <VolumeSlider value={clickVolume} onChange={setClickVolume} />
                <div
                  className="mt-2 flex justify-between"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    color: "var(--color-dim-2)",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  <span>MUTE</span>
                  <span>050</span>
                  <span>MAX</span>
                </div>
              </div>
            </SettingRow>
            <SettingRow label="CLICK SOUND">
              <div className="mt-3 grid grid-cols-4 gap-2">
                {CLICK_SOUNDS.map((s) => (
                  <ChoiceCard key={s} label={s} active={clickSound === s} onClick={() => setClickSound(s)} />
                ))}
              </div>
            </SettingRow>
            <SettingRow
              label="ACCENT DOWNBEAT"
              description="Emphasize beat 1 of each bar."
              control={<Toggle on={accentDownbeat} onChange={setAccentDownbeat} ariaLabel="Accent downbeat" />}
            />
            <SettingRow label="PRE-ROLL BARS">
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
        <Section number="04" title="ABOUT">
          <AboutRow label="VERSION" value="2.0.0" />
          <AboutRow label="RELEASED" value="2026.04.22" />
          <AboutRow label="CHANNEL" value="STABLE" />
          <AboutRow label="MADE BY" value="FOCUSWAVE" />
        </Section>
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <MetaTag>
        {number} · {title}
      </MetaTag>
      <div className="mt-3">{children}</div>
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
        padding: "14px 16px",
        border: "1px solid var(--color-line)",
        marginBottom: -1,
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

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Click volume"
      style={{
        width: "100%",
        accentColor: "var(--color-accent)",
      }}
    />
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
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Settings</div>
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
      {active && <span style={{ color: "var(--color-accent)" }}>●</span>}
    </button>
  );
}

function PcTopRail({ title, subtitle, onApply }: { title: string; subtitle: string; onApply: () => void }) {
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
      <ConsoleBtn tone="white" onClick={onApply}>
        APPLY CHANGES
      </ConsoleBtn>
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
        <div style={{ position: "relative", flex: 1, height: 14, display: "flex", alignItems: "center" }}>
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
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="PROFILE" desc="Signed in via Google. Identity sourced from your Google account." span={2}>
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
      <PcSettingRow label="SESSION" desc="End your current session on this device." span={2}>
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
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="DISPLAY LOCALE" desc="Affects all UI copy across the app." span={2}>
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
  clickAriaLabel,
  clickDescription,
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
  clickAriaLabel: string;
  clickDescription: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="CLICK TRACK" desc={clickDescription}>
        <Toggle on={clickEnabled} onChange={onClickEnabled} ariaLabel={clickAriaLabel} />
      </PcSettingRow>
      <PcSettingRow label="COUNT-IN" desc="Play 4 beats before the song starts in Auto mode.">
        <Toggle on={countIn} onChange={onCountIn} ariaLabel="Count-in" />
      </PcSettingRow>
      <PcSettingRow label="CLICK VOLUME" desc="Level of the metronome audio output." span={2}>
        <PcVolumeSlider value={clickVolume} onChange={onClickVolume} ariaLabel="Click volume" />
      </PcSettingRow>
      <PcSettingRow label="CLICK SOUND" desc="Tonal character of the metronome." span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {CLICK_SOUNDS.map((s) => (
            <PcSoundCard
              key={s}
              label={s}
              desc={CLICK_SOUND_DESCRIPTIONS[s]}
              active={clickSound === s}
              onClick={() => onClickSound(s)}
            />
          ))}
        </div>
      </PcSettingRow>
      <PcSettingRow label="ACCENT DOWNBEAT" desc="Emphasize beat 1 of each bar.">
        <Toggle on={accentDownbeat} onChange={onAccentDownbeat} ariaLabel="Accent downbeat" />
      </PcSettingRow>
      <PcSettingRow label="PRE-ROLL BARS" desc="Silent bars before Count-in (Auto).">
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
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="THEME" desc="Switch between dark, system-driven, and light surfaces." span={2}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {APPEARANCES.map((a) => {
            const active = appearance === a;
            return (
              <button
                key={a}
                type="button"
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
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="KEYBOARD" desc="Shortcuts available in Perform mode." span={2}>
        <div className="flex flex-col">
          {SHORTCUTS.map((s) => (
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
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignContent: "flex-start",
      }}
    >
      <PcSettingRow label="BUILD" desc="Version metadata for the current deployment." span={2}>
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
