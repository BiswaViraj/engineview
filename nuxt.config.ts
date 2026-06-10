// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/fonts"],
  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "EngineView",
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
      meta: [
        {
          name: "description",
          content:
            "Run SQL against your Cloudflare Analytics Engine datasets, save queries, and build dashboards.",
        },
      ],
    },
  },

  // Self-hosted at build time, no runtime CDN. Archivo (display) is grotesque
  // and mechanical; Hanken Grotesk (body) is a humanist counterpoint; JetBrains
  // Mono carries SQL and data.
  fonts: {
    families: [
      { name: "Archivo", provider: "google", weights: [500, 600, 700] },
      { name: "Hanken Grotesk", provider: "google", weights: [400, 500, 600, 700] },
      { name: "JetBrains Mono", provider: "google", weights: [400, 500, 600] },
    ],
  },

  // Security headers applied to every response. A strict Content-Security-Policy
  // is intentionally left out: it needs per-deploy nonces to allow Nuxt's inline
  // hydration payload and would break dev HMR, so it is best configured at the
  // edge/proxy for a given deployment.
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      },
    },
  },
});
