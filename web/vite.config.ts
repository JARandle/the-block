import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Injects <link rel="preload"> tags for the woff2 font files produced by
 * @fontsource into the built index.html. Without this the browser only
 * discovers the font URLs after it has downloaded and parsed the extracted CSS
 * bundle, adding an extra round-trip on the critical path.
 *
 * Only the primary body font (DM Sans) and display font (Instrument Sans) at
 * common weights are preloaded; all other font variants are loaded normally.
 */
function fontPreloadPlugin(): Plugin {
  // Only preload the fonts that render above-the-fold content:
  //   - dm-sans-latin wght normal: single variable file covering all weights (body + UI)
  //   - instrument-sans-latin 600/700: used for headings and display text
  // Italic, latin-ext, and lighter weights load normally after the first paint.
  const PRELOAD_PATTERN =
    /\/(dm-sans-latin-wght-normal|instrument-sans-latin-(600|700)-normal)[^/]*\.woff2$/;
  return {
    name: "font-preload",
    apply: "build",
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      const preloadTags = Object.keys(ctx.bundle)
        .filter((f) => PRELOAD_PATTERN.test("/" + f))
        .map(
          (f) =>
            `    <link rel="preload" as="font" type="font/woff2" href="/${f}" crossorigin="anonymous" />`
        )
        .join("\n");
      if (!preloadTags) return html;
      return html.replace("</head>", `${preloadTags}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), fontPreloadPlugin()],
  server: {
    proxy: {
      /**
       * Proxy all `/api/marketcheck/*` requests through the Vite dev server to
       * the Marketcheck API origin. This sidesteps the browser's CORS policy,
       * which blocks direct fetch() calls to third-party origins, and keeps the
       * API key out of the browser's Network tab since the forwarded request is
       * made server-side by Node.
       *
       * In production a real server-side proxy (e.g. an Express middleware or
       * serverless function) would be needed in place of this Vite-only config.
       */
      "/api/marketcheck": {
        target: "https://api.marketcheck.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/marketcheck/, ""),
      },
      /**
       * Proxy Frankfurter exchange rate requests through the dev server to
       * avoid CORS restrictions on the direct cross-origin fetch from the
       * browser. No API key is required — this is purely an origin bypass.
       */
      "/api/frankfurter": {
        target: "https://api.frankfurter.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/frankfurter/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    assetsInlineLimit: 4096,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
