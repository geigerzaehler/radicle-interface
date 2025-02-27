/// <reference types="vitest" />

import type { Connect, ViteDevServer } from "vite";
import type http from "node:http";

import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  test: {
    setupFiles: "./tests/support/setupVitest",
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts"],
    reporters: "verbose",
  },
  plugins: [
    svelte({
      compilerOptions: { dev: process.env.NODE_ENV !== "production" },
    }),
    configureDevServer(),
    configurePreviewServer(),
  ],
  server: {
    host: "localhost",
    port: 3000,
  },
  resolve: {
    alias: {
      "@app": path.resolve("./src"),
      "@public": path.resolve("./public"),
      "@httpd-client": path.resolve("./httpd-client"),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: [
            "@radicle/gray-matter",
            "dompurify",
            "hast-util-to-dom",
            "hast-util-to-html",
            "katex",
            "marked",
          ],
          syntax: ["@wooorm/starry-night"],
          grammarsTsx: [
            "@wooorm/starry-night/lang/source.ts.js",
            "@wooorm/starry-night/lang/source.tsx.js",
          ],
          grammars: [
            "@wooorm/starry-night/lang/source.python.js",
            "@wooorm/starry-night/lang/source.js.js",
            "@wooorm/starry-night/lang/source.perl.js",
            "@wooorm/starry-night/lang/source.haskell.js",
            "@wooorm/starry-night/lang/source.ruby.js",
            "@wooorm/starry-night/lang/source.css.js",
            "@wooorm/starry-night/lang/source.solidity.js",
            "@wooorm/starry-night/lang/source.cs.js",
            "@wooorm/starry-night/lang/source.swift.js",
          ],
          dom: ["svelte", "twemoji"],
        },
      },
    },
  },

  define: {
    VITEST: process.env.VITEST !== undefined,
    PLAYWRIGHT: process.env.PLAYWRIGHT_TEST_BASE_URL !== undefined,
  },
});

function configureDevServer() {
  return {
    name: "configure-dev-server",
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req, _res, next) => {
          req.url = "/index.html";
          next();
        });
      };
    },
  };
}

function configurePreviewServer() {
  return {
    name: "configure-preview-server",
    configurePreviewServer(server: {
      middlewares: Connect.Server;
      httpServer: http.Server;
    }) {
      server.middlewares.use((req, _res, next) => {
        if (
          fs.existsSync(`./public${req.url}`) ||
          req.url?.startsWith("/assets")
        ) {
          return next();
        }
        req.url = "/index.html";
        next();
      });
    },
  };
}
