/**
 * Roda todos os agentes de teste em sequência.
 * Uso: npm test
 */
import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";

const agentsDir = join(__dirname, "agents");
const agents = readdirSync(agentsDir)
  .filter((f) => f.startsWith("test-agent-") && f.endsWith(".ts"))
  .sort();

let totalPass = 0;
let totalFail = 0;
const results: { agent: string; ok: boolean; output: string }[] = [];

for (const agent of agents) {
  const path = join(agentsDir, agent);
  process.stdout.write(`\n▶ ${agent} … `);
  const r = spawnSync("npx", ["tsx", path], {
    encoding: "utf8",
    cwd: join(__dirname, ".."),
  });
  const out = (r.stdout || "") + (r.stderr || "");
  const ok = r.status === 0;
  results.push({ agent, ok, output: out.trim() });
  if (ok) {
    totalPass++;
    process.stdout.write("PASS\n");
  } else {
    totalFail++;
    process.stdout.write("FAIL\n");
  }
}

console.log("\n" + "═".repeat(50));
console.log(`Agentes: ${totalPass} passaram, ${totalFail} falharam (${agents.length} total)`);
console.log("═".repeat(50));

for (const { agent, ok, output } of results) {
  if (!ok) {
    console.log(`\n❌ ${agent}\n${output.slice(-1200)}`);
  }
}

process.exit(totalFail > 0 ? 1 : 0);
