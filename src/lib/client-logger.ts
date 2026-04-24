export const clientLogger = {
  error: (operation: string, error: unknown) => {
    console.error(`[struq] ${operation}`, error);
  },
  warn: (operation: string, detail: unknown) => {
    console.warn(`[struq] ${operation}`, detail);
  },
};
