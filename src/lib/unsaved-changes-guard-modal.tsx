import { useBlocker } from "@tanstack/react-router";
import { useCallback } from "react";
import { useI18n } from "@/i18n";
import { ConfirmModal } from "@/lib/confirm-modal";

const noop = () => {};

export function UnsavedChangesGuardModal({ isDirty }: { isDirty: boolean }) {
  const { t } = useI18n();
  const shouldBlockFn = useCallback(() => isDirty, [isDirty]);
  const blocker = useBlocker({ shouldBlockFn, withResolver: true, enableBeforeUnload: true });

  return (
    <ConfirmModal
      open={blocker.status === "blocked"}
      title={t.common.unsavedChangesTitle}
      message={t.common.unsavedChangesMessage}
      confirmLabel={t.common.discardAndLeave}
      cancelLabel={t.common.cancel}
      onConfirm={blocker.proceed ?? noop}
      onCancel={blocker.reset ?? noop}
    />
  );
}
