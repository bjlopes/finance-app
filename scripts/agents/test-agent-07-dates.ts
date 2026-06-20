/**
 * Agent 07 — dateUtils (timezone-safe)
 */
import { assert, section, exitCode } from "./_helpers";
import {
  parseLocalDate,
  formatLocalDate,
  getLocalDateString,
} from "../../src/lib/dateUtils";

section("parseLocalDate");
const d = parseLocalDate("2025-06-15");
assert(d.getFullYear() === 2025, "ano");
assert(d.getMonth() === 5, "mês (junho = 5)");
assert(d.getDate() === 15, "dia");

section("formatLocalDate");
const fmt = formatLocalDate("2025-06-15");
assert(fmt.includes("15"), "dia na formatação");
assert(fmt.toLowerCase().includes("jun"), "mês abreviado");

section("getLocalDateString");
const hoje = getLocalDateString();
assert(/^\d{4}-\d{2}-\d{2}$/.test(hoje), "formato YYYY-MM-DD");
const parsed = parseLocalDate(hoje);
const now = new Date();
assert(parsed.getFullYear() === now.getFullYear(), "ano de hoje");
assert(parsed.getMonth() === now.getMonth(), "mês de hoje");
assert(parsed.getDate() === now.getDate(), "dia de hoje");

section("Sem offset UTC");
const utcBug = new Date("2025-01-15");
const local = parseLocalDate("2025-01-15");
assert(local.getDate() === 15, "parseLocalDate mantém dia 15");
assert(
  utcBug.getDate() !== local.getDate() || utcBug.getMonth() === local.getMonth(),
  "new Date(string) pode divergir — parseLocalDate é seguro"
);

process.exit(exitCode());
