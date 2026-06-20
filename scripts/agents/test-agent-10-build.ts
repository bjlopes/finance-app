/**
 * Agent 10 — artefatos de build + inventário de rotas
 */
import fs from "node:fs";
import path from "node:path";
import { assert, section, exitCode } from "./_helpers";

const ROOT = path.resolve(__dirname, "../..");
const APP_DIR = path.join(ROOT, "src", "app");

const REQUIRED_ARTIFACTS = [
  ".next/BUILD_ID",
  ".next/routes-manifest.json",
  ".next/app-path-routes-manifest.json",
  ".next/build-manifest.json",
  ".next/server",
  ".next/static",
];

const ROUTE_FILES = new Set(["page.tsx", "page.ts", "route.ts"]);

function listAppRoutes(dir: string, segments: string[] = []): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.startsWith("(") && ent.name.endsWith(")")) {
        routes.push(...listAppRoutes(full, segments));
      } else if (!ent.name.startsWith("@")) {
        routes.push(...listAppRoutes(full, [...segments, ent.name]));
      }
      continue;
    }
    if (ROUTE_FILES.has(ent.name)) {
      routes.push(segments.length ? `/${segments.join("/")}` : "/");
    }
  }
  return Array.from(new Set(routes)).sort();
}

section("Build artifacts (.next)");
for (const rel of REQUIRED_ARTIFACTS) {
  assert(fs.existsSync(path.join(ROOT, rel)), `${rel} existe`);
}

const buildIdPath = path.join(ROOT, ".next/BUILD_ID");
if (fs.existsSync(buildIdPath)) {
  const id = fs.readFileSync(buildIdPath, "utf8").trim();
  assert(id.length > 0, "BUILD_ID não vazio");
}

section("Rotas do app");
const routes = listAppRoutes(APP_DIR);
const expected = [
  "/",
  "/dashboard",
  "/transacoes",
  "/contas",
  "/tags",
  "/backup",
  "/relatorios",
  "/login",
  "/signup",
];
for (const r of expected) {
  assert(routes.includes(r), `rota ${r} existe`);
}
assert(routes.length >= expected.length, `≥ ${expected.length} rotas descobertas`);

section("Manifest alinhado");
const manifestPath = path.join(ROOT, ".next/app-path-routes-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, string>;
  const manifestRoutes = new Set(Object.values(manifest).map((p) => p.replace(/\/$/, "") || "/"));
  for (const r of ["/dashboard", "/transacoes", "/contas"]) {
    assert(manifestRoutes.has(r), `${r} no manifest`);
  }
}

process.exit(exitCode());
