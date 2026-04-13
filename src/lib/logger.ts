export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => console.log(JSON.stringify({ level: "info", msg, ...ctx })),
  warn: (msg: string, ctx?: Record<string, unknown>) => console.warn(JSON.stringify({ level: "warn", msg, ...ctx })),
  error: (msg: string, ctx?: Record<string, unknown>) => console.error(JSON.stringify({ level: "error", msg, ...ctx })),
};
