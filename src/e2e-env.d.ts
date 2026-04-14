// Extends Cloudflare worker env with optional E2E test variable
// Add E2E_TEST=1 to .dev.vars when running E2E tests
declare namespace Cloudflare {
  interface Env {
    E2E_TEST?: string;
  }
}
