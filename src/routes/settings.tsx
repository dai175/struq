import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logout, requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const logoutFn = useServerFn(logout);

  const handleLogout = async () => {
    try {
      await logoutFn();
      router.navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-sans text-text-primary mb-6">{t.nav.settings}</h1>

      <div className="mb-6 flex items-center gap-3">
        {user?.avatarUrl && <img src={user?.avatarUrl} alt={user?.name} className="w-10 h-10 rounded-full" />}
        <div>
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-700 transition-colors duration-150"
        >
          {t.nav.logout}
        </button>
      </div>
    </div>
  );
}
