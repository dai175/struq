declare namespace Cloudflare {
  interface Env {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    SESSION_SECRET: string;
  }
}

declare module "cloudflare:workers" {
  const env: Cloudflare.Env;
}
