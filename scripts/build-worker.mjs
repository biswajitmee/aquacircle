import { build } from "esbuild";
await build({
  entryPoints: [
    "scripts/worker.ts",
    "scripts/retention.ts",
    "scripts/migrate.ts",
    "scripts/operations.ts",
  ],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outdir: "dist/operations",
  outExtension: { ".js": ".mjs" },
  target: "node22",
});
