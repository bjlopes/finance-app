/**
 * Agent 12 — layout responsivo (Tailwind + globals.css)
 */
import fs from "node:fs";
import path from "node:path";
import { assert, section, exitCode } from "./_helpers";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

section("Breakpoints Tailwind");
const tw = read("tailwind.config.ts");
assert(tw.includes('phone: { max: "430px" }'), "breakpoint phone ≤430px");
assert(tw.includes('tablet: "834px"'), "breakpoint tablet 834px");
assert(tw.includes('ipad: "1152px"'), "breakpoint ipad 1152px");

section("Referência iPhone 17 Pro");
const css = read("src/app/globals.css");
assert(css.includes("--ref-phone-viewport-w: 402"), "largura ref phone 402");
assert(css.includes("--ref-phone-viewport-h: 874"), "altura ref phone 874");
assert(css.includes("safe-area-inset"), "safe areas");

section("Classes utilitárias");
assert(css.includes(".touch-target"), "touch-target definido");
assert(css.includes("min-height: 44px"), "alvo de toque 44px");
assert(css.includes(".modal-overlay"), "modal-overlay");
assert(css.includes(".modal-content-centered"), "modal-content-centered");
assert(css.includes("100dvh"), "viewport dinâmico");

section("Uso nas páginas");
const dashboard = read("src/app/dashboard/page.tsx");
const transacoes = read("src/app/transacoes/page.tsx");
const nav = read("src/components/Nav.tsx");

assert(dashboard.includes("phone:"), "dashboard usa phone:");
assert(dashboard.includes("modal-overlay"), "dashboard usa modal");
assert(transacoes.includes("touch-target"), "transações usa touch-target");
assert(transacoes.includes("tablet:"), "transações usa tablet:");
assert(nav.includes("tablet:hidden"), "nav esconde hamburger em tablet+");
assert(nav.includes("min-h-[44px]"), "nav botões 44px");
assert(nav.includes("env(safe-area-inset-top)"), "nav safe area top");

section("Input font-size mobile");
assert(css.includes("font-size: 16px"), "inputs 16px (evita zoom iOS)");

process.exit(exitCode());
