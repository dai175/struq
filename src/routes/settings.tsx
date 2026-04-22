import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useState } from "react";
import { logout, requireAuth, updateLocale } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { useClickPreference } from "@/songs/click-preference";
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

  // New settings — UI-only (not persisted); matches the broadcast spec
  // until a user_settings table lands in a follow-up PR.
  const [countIn, setCountIn] = useState(false);
  const [clickVolume, setClickVolume] = useState(62);
  const [clickSound, setClickSound] = useState<ClickSound>("TICK");
  const [accentDownbeat, setAccentDownbeat] = useState(true);
  const [preRollBars, setPreRollBars] = useState<PreRoll>(0);
  const [appearance, setAppearance] = useState<Appearance>("DARK");

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
      <div className="mx-auto max-w-2xl px-5 pt-6 pb-10 lg:px-10 lg:pt-10">
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
