import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logout, requireAuth, updateLocale } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/types";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const logoutFn = useServerFn(logout);
  const updateLocaleFn = useServerFn(updateLocale);

  const handleLogout = async () => {
    try {
      await logoutFn();
      router.navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLocaleChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      await updateLocaleFn({ data: { locale: newLocale } });
    } catch (error) {
      console.error("Failed to update locale:", error);
      setLocale(locale); // revert on error
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="mb-6 text-xl font-bold">{t.nav.settings}</h1>

      <div className="mb-6 flex items-center gap-3">
        {user?.avatarUrl && <img src={user?.avatarUrl} alt={user?.name} className="h-10 w-10 rounded-full" />}
        <div>
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-px rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">{t.settings.language}</span>
          <div className="flex gap-1">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLocaleChange(l)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  locale === l ? "bg-text-primary text-white" : "text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-red-600 transition-colors duration-150 hover:text-red-700"
          >
            {t.nav.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
