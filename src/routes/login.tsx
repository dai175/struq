import { createFileRoute, redirect } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { Logomark } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

const ERROR_KEYS = {
  account_deleted: "accountDeleted",
  auth_failed: "authFailed",
  oauth_denied: "loginCancelled",
  invalid_state: "invalidState",
} as const;

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/setlists" });
    }
  },
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: LoginPage,
});

/** Static "Love Me Do" 10-section demo used as the login hero structure. */
const DEMO_SECTIONS: { id: string; type: SectionType; bars: number; label: string }[] = [
  { id: "1", type: "intro", bars: 4, label: "Intro" },
  { id: "2", type: "a", bars: 8, label: "A" },
  { id: "3", type: "chorus", bars: 8, label: "Chorus" },
  { id: "4", type: "a", bars: 8, label: "A" },
  { id: "5", type: "interlude", bars: 4, label: "Interlude" },
  { id: "6", type: "bridge", bars: 8, label: "Bridge" },
  { id: "7", type: "a", bars: 8, label: "A" },
  { id: "8", type: "solo", bars: 8, label: "Solo" },
  { id: "9", type: "chorus", bars: 8, label: "Chorus" },
  { id: "10", type: "outro", bars: 4, label: "Outro" },
];

function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google"
      className="flex w-full items-center justify-center gap-3"
      style={{
        background: "#fff",
        color: "#111",
        padding: "16px 20px",
        borderRadius: 2,
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <GoogleGlyph />
      {label}
    </a>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: "12px 14px",
        border: "1px solid var(--color-section-solo)",
        background: "rgba(239, 68, 68, 0.08)",
        color: "var(--color-section-solo)",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        marginBottom: 24,
      }}
    >
      {message}
    </div>
  );
}

function LoginPage() {
  const { t } = useI18n();
  const { error } = Route.useSearch();
  const errorKey = error ? ERROR_KEYS[error as keyof typeof ERROR_KEYS] : undefined;
  const errorMessage = error ? (errorKey ? t.auth[errorKey] : t.auth.authFailed) : null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* PC — 2-column broadcast layout */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: "1.1fr 1fr",
          minHeight: "100vh",
        }}
      >
        <LoginLeftPane />
        <LoginRightPane errorMessage={errorMessage} />
      </div>

      {/* Mobile — stacked */}
      <div className="flex min-h-screen flex-col lg:hidden">
        <LoginMobileHeader />
        <LoginMobileBody errorMessage={errorMessage} />
        <LoginMobileFooter />
      </div>
    </div>
  );
}

function LoginLeftPane() {
  const { t } = useI18n();
  return (
    <div
      style={{
        padding: "40px 56px",
        borderRight: "1px solid var(--color-line)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 40,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logomark size={32} />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Struq
          </div>
        </div>
        <MetaTag>V 2.0 · FOCUSWAVE</MetaTag>
      </div>

      <div>
        <MetaTag color="var(--color-accent)">STRUCTURE · REHEARSAL · LIVE</MetaTag>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginTop: 22,
          }}
        >
          {t.auth.heroPc}
          <br />
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{t.auth.heroPcDim}</span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-dim)",
            marginTop: 20,
            maxWidth: 460,
            lineHeight: 1.6,
          }}
        >
          {t.auth.bodyCopy}
        </p>
      </div>

      <div>
        <MetaTag>EXAMPLE · LOVE ME DO / 10 SECTIONS / 60 BARS</MetaTag>
        <div style={{ marginTop: 14 }}>
          <StructureBar sections={DEMO_SECTIONS} height={10} gap={3} showAbbreviations />
        </div>
      </div>
    </div>
  );
}

function LoginRightPane({ errorMessage }: { errorMessage: string | null }) {
  const { t } = useI18n();
  return (
    <div
      style={{
        padding: "40px 56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div className="flex justify-between">
        <MetaTag>ACCESS</MetaTag>
        <MetaTag>EN · JA</MetaTag>
      </div>

      <div style={{ maxWidth: 420 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {t.auth.signInTitle}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-dim)",
            marginTop: 10,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          {t.auth.signInBody}
        </p>

        {errorMessage && <ErrorBanner message={errorMessage} />}

        <GoogleButton label={t.auth.continueWithGoogle} />

        <div
          className="flex gap-3"
          style={{
            marginTop: 22,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--color-dim-2)",
            textTransform: "uppercase",
          }}
        >
          <span>SECURE</span>
          <span>·</span>
          <span>NO PASSWORD</span>
          <span>·</span>
          <span>SSO</span>
        </div>
      </div>

      <div className="flex justify-between">
        <MetaTag>STRUQ.FOCUSWAVE.CC</MetaTag>
        <MetaTag>© 2026</MetaTag>
      </div>
    </div>
  );
}

function LoginMobileHeader() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "18px 22px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Logomark size={22} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>Struq</div>
      </div>
      <MetaTag size={9}>V 2.0</MetaTag>
    </div>
  );
}

function LoginMobileBody({ errorMessage }: { errorMessage: string | null }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col justify-center" style={{ padding: "40px 22px" }}>
      <MetaTag color="var(--color-accent)" size={10}>
        STRUCTURE · REHEARSAL · LIVE
      </MetaTag>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginTop: 14,
        }}
      >
        {t.auth.heroMobile1}
        <br />
        {t.auth.heroMobile2}
        <br />
        <span style={{ color: "rgba(255,255,255,0.55)" }}>{t.auth.heroMobileDim}</span>
      </div>

      <div style={{ marginTop: 42 }}>
        <MetaTag size={9}>EXAMPLE STRUCTURE</MetaTag>
        <div style={{ marginTop: 10 }}>
          <StructureBar sections={DEMO_SECTIONS} height={6} gap={2} />
        </div>
      </div>

      <div style={{ marginTop: 42 }}>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        <GoogleButton label={t.auth.continueWithGoogle} />
      </div>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "var(--color-dim-2)",
          textTransform: "uppercase",
        }}
      >
        SECURE · NO PASSWORD · SSO
      </div>
    </div>
  );
}

function LoginMobileFooter() {
  return (
    <div
      className="flex justify-between"
      style={{
        padding: "14px 22px",
        borderTop: "1px solid var(--color-line)",
      }}
    >
      <MetaTag size={9}>FOCUSWAVE</MetaTag>
      <MetaTag size={9}>EN · JA</MetaTag>
    </div>
  );
}
