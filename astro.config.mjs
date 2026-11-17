import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      IP_SALT: envField.string({ context: "server", access: "secret" }),
    },
  },
  experimental: {},
});
