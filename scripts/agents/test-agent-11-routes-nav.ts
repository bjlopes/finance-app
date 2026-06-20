/**
 * Agent 11 — Nav links vs páginas existentes
 */
import fs from "node:fs";
import path from "node:path";
import { assert, section, exitCode } from "./_helpers";

const ROOT = path.resolve(__dirname, "../..");
const NAV_PATH = path.join(ROOT, "src/components/Nav.tsx");

section("Links do Nav");
const navSrc = fs.readFileSync(NAV_PATH, "utf8");
const hrefs = [...navSrc.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);

const expectedLinks = ["/", "/dashboard", "/transacoes", "/contas", "/tags", "/backup"];
for (const href of expectedLinks) {
  assert(hrefs.includes(href), `Nav tem link ${href}`);
}
assert(hrefs.length === expectedLinks.length, "6 links principais");

section("Páginas correspondentes");
for (const href of expectedLinks) {
  const pagePath =
    href === "/"
      ? path.join(ROOT, "src/app/page.tsx")
      : path.join(ROOT, "src/app", href.slice(1), "page.tsx");
  assert(fs.existsSync(pagePath), `page existe: ${href}`);
}

section("Labels e ícones");
assert(navSrc.includes('label: "Nova"'), 'label "Nova"');
assert(navSrc.includes('label: "Dashboard"'), 'label "Dashboard"');
assert(navSrc.includes("PlusCircle"), "ícone Nova");
assert(navSrc.includes("LayoutDashboard"), "ícone Dashboard");
assert(navSrc.includes('aria-label="Abrir menu"'), "acessibilidade menu mobile");

section("Auth links");
assert(navSrc.includes('href="/login"'), "link login");
assert(navSrc.includes('href="/signup"'), "link signup");

process.exit(exitCode());
