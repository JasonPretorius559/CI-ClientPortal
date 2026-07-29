import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(() => {
  const sentryRelease =
    process.env.SENTRY_RELEASE ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA;
  const canUploadSourceMaps = Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      sentryRelease,
  );
  const sourceMapMode: false | "hidden" = canUploadSourceMaps
    ? "hidden"
    : false;

  return {
    plugins: [
      react(),
      ...(canUploadSourceMaps
        ? [
            sentryVitePlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              release: {
                name: sentryRelease,
                setCommits: { auto: true, ignoreMissing: true },
              },
              sourcemaps: {
                filesToDeleteAfterUpload: "./dist/**/*.map",
              },
            }),
          ]
        : []),
    ],
    build: {
      sourcemap: sourceMapMode,
    },
    define: {
      "process.env.DRAGGABLE_DEBUG": "false",
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(
        sentryRelease ?? "",
      ),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
