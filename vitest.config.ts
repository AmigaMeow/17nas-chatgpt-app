import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
export default defineConfig({plugins:[cloudflareTest({wrangler:{configPath:'./wrangler.jsonc'},miniflare:{bindings:{HMAC_SECRET:'test-only-secret-with-more-than-32-characters'}}})],test:{include:['tests/**/*.test.ts']}});
