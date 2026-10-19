#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Fails when the README's user-facing contract and the code disagree: the
 * debug-log lines `hooks/handle.ts` writes, the reasons the gate gives for a
 * skip, the malformed-reply refusal, and the numbers the README quotes
 * (deadline, retry limits, prompt size limits, guard growth cap).
 *
 * Usage: node scripts/doc-parity.mjs [--root <dir>]
 * `--root` points the check at another checkout, which the self-test in
 * CONTRIBUTING uses to confirm a dropped README row is caught.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const argRoot = process.argv.indexOf("--root");
const root =
  argRoot === -1
    ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    : path.resolve(process.argv[argRoot + 1] ?? ".");
const read = (file) => readFileSync(path.join(root, file), "utf8");

const readme = read("README.md");
const handle = read("hooks/handle.ts");
const gate = read("hooks/gate.ts");
const client = read("hooks/client.ts");
const guard = read("hooks/guard.ts");

const problems = [];
const need = (ok, message) => {
  if (!ok) problems.push(message);
};

/** The text of a `## ` section of the README, up to the next `## ` heading. */
const section = (title) => {
  const start = readme.indexOf(`\n## ${title}\n`);
  if (start === -1) {
    problems.push(`README has no "## ${title}" section`);
    return "";
  }
  const rest = readme.slice(start + 1);
  const end = rest.indexOf("\n## ", 1);
  return end === -1 ? rest : rest.slice(0, end);
};

/** A number written in code, read from `export const NAME = 6500`. */
const constant = (source, name) => {
  const match = new RegExp(`const ${name} = ([0-9._]+)`).exec(source);
  if (match === null) {
    problems.push(`no constant ${name} found`);
    return NaN;
  }
  return Number(match[1].replaceAll("_", ""));
};

// 1. Debug-log lines: every `ui.log` prefix in handle.ts has a row in the
//    README table, every row maps to a prefix, and the grep patterns match.
const prefixes = [
  ...handle.matchAll(/ui\.log\(`\$\{NAME\}: ([a-z][a-z ]*?) \(/g),
].map((m) => m[1]);
need(prefixes.length > 0, "found no ui.log prefixes in hooks/handle.ts");

const logSection = section("Reading the debug log");
const rows = [...logSection.matchAll(/^\| `([a-z][a-z ]*?) \(/gm)].map((m) => m[1]);
for (const prefix of new Set(prefixes)) {
  need(rows.includes(prefix), `log line "${prefix} (" has no row in README "Reading the debug log"`);
}
for (const row of new Set(rows)) {
  need(prefixes.includes(row), `README log row "${row} (" matches no ui.log line in hooks/handle.ts`);
}

const greps = [...readme.matchAll(/grep -E 'm3l-prompt-optimizer: \(([^)]*)\)'/g)].map((m) =>
  m[1].split("|"),
);
need(greps.length >= 2, "README should show the outcome grep in both First run and Reading the debug log");
for (const alternatives of greps) {
  for (const prefix of new Set(prefixes)) {
    need(
      alternatives.some((a) => prefix.startsWith(a)),
      `README grep pattern misses the "${prefix}" line`,
    );
  }
  for (const a of alternatives) {
    need(prefixes.some((p) => p.startsWith(a)), `README grep alternative "${a}" matches no log line`);
  }
}
for (const alternatives of greps.slice(1)) {
  need(
    JSON.stringify([...alternatives].sort()) === JSON.stringify([...greps[0]].sort()),
    "README grep patterns differ between First run and Reading the debug log",
  );
}

// 2. Gate reasons: each reason the gate can give is named in the
//    `gate skipped` row of the log table.
const gateRow = logSection.split("\n").find((l) => l.startsWith("| `gate skipped (")) ?? "";
need(gateRow !== "", 'README log table has no "gate skipped" row');
const reasons = [
  ...[...gate.matchAll(/skip\('([^']+)'\)/g)].map((m) => m[1]),
  ...[...gate.matchAll(/reason: '([^']+)'/g)].map((m) => m[1]),
  ...[...gate.matchAll(/skip\(`([a-z ]+?) \$\{/g)].map((m) => `${m[1]} <kind>`),
];
need(reasons.length >= 10, `expected at least 10 gate reasons, found ${reasons.length}`);
for (const reason of reasons) {
  need(gateRow.includes(`\`${reason}\``), `gate reason "${reason}" is not listed in the README "gate skipped" row`);
}

// 3. The malformed-reply refusal is logged by the code and named in the README.
need(handle.includes("rewrite refused (malformed reply;"), "hooks/handle.ts no longer logs `rewrite refused (malformed reply;`");
need(logSection.includes("malformed reply"), 'README log table does not mention "malformed reply"');

// 4. Numbers the README quotes.
const totalMs = constant(client, "TOTAL_MS");
const minRetryMs = constant(client, "MIN_RETRY_MS");
const retryAfterMs = constant(client, "MAX_RETRY_AFTER_MS");
const minChars = constant(gate, "MIN_CHARS");
const minWords = constant(gate, "MIN_WORDS");
const maxChars = constant(gate, "MAX_CHARS");
const growth = constant(guard, "MAX_GROWTH");
const extraChars = constant(guard, "MAX_EXTRA_CHARS");

const pauses = section("When it pauses");
const pretty = (n) => n.toLocaleString("en-US");
const expectations = [
  [pauses, `${totalMs / 1000}-second deadline`, "the call deadline"],
  [pauses, `at least ${minRetryMs / 1000} seconds remain`, "the minimum time left for a retry"],
  [pauses, `\`retry-after\` is ${retryAfterMs / 1000} seconds or less`, "the longest retry-after that is waited out"],
  [readme, `under ${minChars} characters or ${minWords} words, or over ${pretty(maxChars)} characters`, "the gate size limits"],
  [readme, `at most one and a half times the original plus ${extraChars} characters`, "the guard length cap"],
];
need(growth === 1.5, `MAX_GROWTH is ${growth}, but the README says "one and a half times"`);
for (const [haystack, text, what] of expectations) {
  need(haystack.includes(text), `README should state ${what} as "${text}"`);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`DRIFT  ${p}`);
  console.error(`\n${problems.length} doc-parity problem(s).`);
  process.exit(1);
}
console.log(`doc-parity: ${new Set(prefixes).size} log lines, ${reasons.length} gate reasons and ${expectations.length} quoted numbers match the README.`);
