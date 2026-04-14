export const clientLogger = {
  error: (operation: string, error: unknown) => {
    console.error(`[struq] ${operation}`, error);
  },
};
