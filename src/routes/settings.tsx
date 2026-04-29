import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useState } from "react";
import { clearCachedUser } from "@/auth/cached-user";
import { logout, requireAuth, updateLocale } from "@/auth/server-fns";
import type { SessionUser } from "@/auth/session";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { type Appearance, useAppearance } from "@/lib/theme";
import { clearAll as clearOfflineCache } from "@/offline/db";
import {
  CLICK_SOUNDS,
  type ClickSound,
  PRE_ROLL_OPTIONS,
  type PreRollBars,
  useAccentDownbeat,
  useClickPreference,
  useClickSound,
  useClickVolume,
  useCountIn,
  usePreRollBars,
} from "@/songs/click-preference";
import { ConsoleBtn } from "@/ui/console-btn";
import { Logomark } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { Toggle } from "@/ui/toggle";
import { TopBar } from "@/ui/top-bar";
import { VolumeSlider } from "@/ui/volume-slider";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

const APPEARANCES: Appearance[] = ["DARK", "AUTO", "LIGHT"];

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
  const [clickVolume, setClickVolume] = useClickVolume();
  const [clickSound, setClickSound] = useClickSound();
  const [countIn, setCountIn] = useCountIn();
  const [preRollBars, setPreRollBars] = usePreRollBars();
  const [accentDownbeat, setAccentDownbeat] = useAccentDownbeat();

  const { appearance, setAppearance } = useAppearance();

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
    let serverLogoutOk = false;
    try {
      await logoutFn();
      serverLogoutOk = true;
    } catch (error) {
      clientLogger.error("logout", error);
    }
    // Once the server has dropped the session, the client must follow through
    // even if cache wipe throws — otherwise the user is stuck on /settings
    // with stale offline data and no way to reach /login.
    if (!serverLogoutOk) return;
    try {
      await clearOfflineCache();
    } catch (error) {
      clientLogger.error("logout.clearOfflineCache", error);
    }
    clearCachedUser();
    router.navigate({ to: "/login" });
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
          left={<Logomark size={28} />}
          right={<MetaTag>V {__APP_SEMVER__}</MetaTag>}
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
              color: "var(--color-text-on-accent)",
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
            <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-strong)" }}>
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
                    background: active ? "var(--color-bg-elevated-hover)" : "transparent",
                    color: active ? "var(--color-text-strong)" : "var(--color-text)",
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-strong)" }}>
                    {LOCALE_LABELS[l]}
                  </div>
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
                ["RELEASED", __APP_RELEASED__],
                ["CHANNEL", "Beta"],
                ["MADE BY", "focuswave"],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <MetaTag size={11} style={{ letterSpacing: "0.2em", color: "var(--color-dim)" }}>
                  {k}
                </MetaTag>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "var(--color-text-strong)",
                  }}
                >
                  {v}
                </span>
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
  disabled = false,
}: {
  label: string;
  description?: string | null;
  control?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      aria-disabled={disabled || undefined}
      style={{
        padding: "14px",
        border: "1px solid var(--color-line)",
        borderRadius: 1,
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--color-text-strong)",
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
  disabled = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "small" | "large";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: size === "large" ? "18px 12px" : "12px 10px",
        background: active ? "var(--color-bg-elevated-hover)" : "transparent",
        border: active ? "1px solid var(--color-text-strong)" : "1px solid var(--color-line)",
        color: active ? "var(--color-text-strong)" : "var(--color-dim)",
        fontFamily: "var(--font-mono)",
        fontSize: size === "large" ? 12 : 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        borderRadius: 2,
      }}
    >
      {label}
    </button>
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
          color: "var(--color-text-strong)",
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
        padding: "14px 0",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ padding: "0 22px 14px", borderBottom: "1px solid var(--color-line)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-strong)" }}>{t.settings.title}</div>
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
        background: active ? "var(--color-bg-elevated-hover)" : "transparent",
        color: active ? "var(--color-text-strong)" : "var(--color-dim)",
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
            color: "var(--color-text-strong)",
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
  disabled = false,
}: {
  label: string;
  desc?: string;
  span?: 1 | 2;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      aria-disabled={disabled || undefined}
      style={{
        gridColumn: span === 2 ? "span 2" : undefined,
        padding: "20px 22px",
        border: "1px solid var(--color-line)",
        background: "var(--color-bg-elevated)",
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 20, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--color-text-strong)",
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
  disabled = false,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "14px 14px",
        textAlign: "left",
        border: active ? "1px solid var(--color-text)" : "1px solid var(--color-line)",
        background: "var(--color-bg-elevated)",
        cursor: disabled ? "not-allowed" : "pointer",
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

function PcPreRollChip({
  value,
  active,
  onClick,
  disabled = false,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 14px",
        border: active ? "1px solid var(--color-text)" : "1px solid var(--color-line)",
        background: active ? "var(--color-bg-elevated-hover)" : "transparent",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.08em",
        fontWeight: 600,
        color: active ? "var(--color-accent)" : "var(--color-dim)",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 1,
      }}
    >
      {value}
    </button>
  );
}

function PcVolumeSlider({
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center" style={{ gap: 16 }}>
        <div style={{ flex: 1 }}>
          <VolumeSlider value={value} onChange={onChange} ariaLabel={ariaLabel} handleHeight={14} disabled={disabled} />
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
              color: "var(--color-text-on-accent)",
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
            <div className="truncate" style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-strong)" }}>
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
                  border: active ? "1px solid var(--color-text-strong)" : "1px solid var(--color-line)",
                  background: active ? "var(--color-bg-elevated-hover)" : "transparent",
                  color: active ? "var(--color-text-strong)" : "var(--color-text)",
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
  preRollBars: PreRollBars;
  onPreRollBars: (v: PreRollBars) => void;
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
                  background: active ? "var(--color-bg-elevated-hover)" : "transparent",
                  border: active ? "1px solid var(--color-text-strong)" : "1px solid var(--color-line)",
                  color: active ? "var(--color-text-strong)" : "var(--color-dim)",
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
    { keys: "SPACE", label: t.settings.shortcut.advance, implemented: true },
    { keys: "◁", label: t.settings.shortcut.previous, implemented: true },
    { keys: "R", label: t.settings.shortcut.reset, implemented: true },
    { keys: "ESC", label: t.settings.shortcut.exit, implemented: true },
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
              aria-disabled={!s.implemented || undefined}
              className="flex items-center justify-between"
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--color-line)",
                opacity: s.implemented ? 1 : 0.4,
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
                  color: "var(--color-text-strong)",
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
          <AboutRow label="VERSION" value={__APP_VERSION__} />
          <AboutRow label="RELEASED" value={__APP_RELEASED__} />
          <AboutRow label="CHANNEL" value="Beta" />
          <AboutRow label="MADE BY" value="focuswave" />
        </div>
      </PcSettingRow>
    </div>
  );
}
