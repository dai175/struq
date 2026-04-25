declare namespace Cloudflare {
  interface Env {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    SESSION_SECRET: string;
    GEMINI_API_KEY: string;
  }
}

declare module "cloudflare:workers" {
  const env: Cloudflare.Env;
}

declare const __APP_VERSION__: string;
declare const __APP_RELEASED__: string;
