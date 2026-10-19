#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Fails when the README's user-facing contract and the code disagree: the
 * debug-log lines `hooks/handle.ts` writes, the reasons the gate gives for a
 * skip, the malformed-reply refusal, the numbers the README quotes (deadline,
 * retry limits, prompt size limits, guard growth cap), the case, pair and bar
 * counts it quotes for the evaluation set, the model default (plugin manifest,
 * `handle.ts` and the Settings table), the guard's refusal reasons, the
 * client's pause and skip reasons, the flags of the three eval scripts and the
 * evaluation bars.
 *
 * This is a docs-kit parity module: it is listed in `docs.config.mjs` `parity`,
 * so `node design/source/docs-kit/build.mjs --check` runs it and merges its
 * messages into one report. The default export is
 * `async ({ root, config }) => string[]`. It also runs on its own:
 *
 *   node scripts/doc-parity.mjs [--root <dir>]
 *
 * `--root` points the check at another checkout, which the self-test in
 * CONTRIBUTING uses to confirm a dropped README row is caught. Exit 1 on drift.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { assertSame, assertSameSet, section } from "../design/source/docs-kit/lib/parity.mjs";
import {
  clientReasons,
  column,
  constNumber,
  constString,
  findTable,
  flagOfCell,
  flagsOf,
  guardReasons,
  percent,
  spans,
} from "./lib/parity-checks.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs every check against the checkout at `root`.
 *
 * @param {string} root
 * @returns {{ problems: string[], summary: string }}
 */
export function check(root) {
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

  /** The text under a README heading, up to the next heading of the same or a higher level. */
  const sec = (title) => {
    const text = section(readme, title);
    if (text === null) {
      problems.push(`README has no "${title}" section`);
      return "";
    }
    return text;
  };

  /** A number written in code, read from `const NAME = 6500`. */
  const constant = (source, name) => {
    const value = constNumber(source, name);
    if (value === null) {
      problems.push(`no constant ${name} found`);
      return NaN;
    }
    return value;
  };

  // 1. Debug-log lines: every `ui.log` prefix in handle.ts has a row in the
  //    README table, every row maps to a prefix, and the grep patterns match.
  const prefixes = [
    ...handle.matchAll(/ui\.log\(`\$\{NAME\}: ([a-z][a-z ]*?) \(/g),
  ].map((m) => m[1]);
  need(prefixes.length > 0, "found no ui.log prefixes in hooks/handle.ts");

  const logSection = sec("Reading the debug log");
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

  const pauses = sec("When it pauses");
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

  // 5. Evaluation counts: the README's case, bucket and pair counts and the bar
  //    thresholds follow evals/cases.json and evals/calibration.json.
  const cases = JSON.parse(read("evals/cases.json"));
  const pairs = JSON.parse(read("evals/calibration.json"));
  const evalSection = sec("Working on this repo");
  const bucket = (expect) => cases.filter((c) => c.expect === expect).length;
  const reaching = cases.length - bucket("skipped");
  const unchangedCount = bucket("unchanged");
  const rewriteCount = bucket("rewrite");
  const realistic = JSON.parse(read("evals/realistic.json"));
  const hardPairs = pairs.filter((pair) => pair.tier === "hard").length;
  const evalExpectations = [
    [`holds ${cases.length} prompts, of which ${reaching} reach the model`, "the prompt count and how many reach the model"],
    [`and ${bucket("skipped")} are stopped by the gate`, "how many prompts the gate stops"],
    [`${pairs.length} pairs with a known answer`, "the calibration pair count"],
    [`${pairs.length - hardPairs} easy and ${hardPairs} hard`, "the easy and hard calibration split"],
    [`holds ${realistic.length} of them`, "the realistic suite size"],
    ...["unchanged", "rewrite", "any", "skipped"].map((e) => [`| \`${e}\` | ${bucket(e)} |`, `the \`${e}\` bucket size`]),
    [`at least ${Math.ceil(unchangedCount * 0.9)} of the ${unchangedCount} \`unchanged\` cases`, "the 90% bar as a count"],
    [`at least ${Math.ceil(rewriteCount * 0.7)} of the ${rewriteCount} \`rewrite\` cases`, "the 70% bar as a count"],
  ];
  for (const [text, what] of evalExpectations) {
    need(evalSection.includes(text), `README "Evaluation" should state ${what} as "${text}"`);
  }
  need(pairs.every((pair) => ["better", "equal", "worse"].includes(pair.expect)), "every calibration pair needs an expect of better, equal or worse");

  // 6. The model default: the plugin manifest, handle.ts and the README
  //    Settings table name the same model, and the same on/off default.
  const manifest = JSON.parse(read(".claude-plugin/plugin.json"));
  const manifestModel = manifest.userConfig?.model?.default;
  const codeModel = constString(handle, "DEFAULT_MODEL");
  need(codeModel !== null, "no constant DEFAULT_MODEL found in hooks/handle.ts");
  need(typeof manifestModel === "string", ".claude-plugin/plugin.json has no userConfig.model.default");
  problems.push(...assertSame("model default (plugin.json against hooks/handle.ts)", manifestModel, codeModel));
  const settings = findTable(sec("Settings"), "Setting");
  const settingRow = (key) => settings?.rows.find((row) => spans(row[0] ?? "").includes(key));
  need(settings !== undefined, 'README "Settings" has no table headed "Setting"');
  const modelRow = settingRow("model");
  need(modelRow !== undefined, 'README "Settings" has no row for `model`');
  if (modelRow !== undefined) {
    problems.push(...assertSame('model default (README "Settings" against hooks/handle.ts)', spans(modelRow[1] ?? "")[0] ?? modelRow[1], codeModel));
  }
  const enabledRow = settingRow("enabled");
  need(enabledRow !== undefined, 'README "Settings" has no row for `enabled`');
  if (enabledRow !== undefined) {
    const documented = (enabledRow[1] ?? "").trim();
    need(
      documented === (manifest.userConfig?.enabled?.default === true ? "on" : "off"),
      `README "Settings" says \`enabled\` defaults to "${documented}", plugin.json says ${manifest.userConfig?.enabled?.default}`,
    );
  }

  // 7. Guard refusal reasons: every `no('…')` in guard.ts is in the "Logged as"
  //    column of the README guard table, and the malformed-reply refusal is too.
  const guardTable = findTable(sec("How it works"), "Check");
  need(guardTable !== undefined, 'README "How it works" has no guard table headed "Check"');
  if (guardTable !== undefined) {
    problems.push(
      ...assertSameSet(
        'guard reasons (README "How it works" guard table against hooks/guard.ts)',
        column(guardTable, "Logged as").flatMap(spans),
        [...guardReasons(guard), "malformed reply"],
      ),
    );
  }

  // 8. Client reasons: every latch and skip reason client.ts can return is in
  //    the "Logged as" column of the README "When it pauses" table.
  const pauseTable = findTable(pauses, "Failure");
  need(pauseTable !== undefined, 'README "When it pauses" has no table headed "Failure"');
  const { latch, skip } = clientReasons(client);
  need(latch.length >= 3 && skip.length >= 5, `expected at least 3 latch and 5 skip reasons in hooks/client.ts, found ${latch.length} and ${skip.length}`);
  if (pauseTable !== undefined) {
    problems.push(
      ...assertSameSet(
        'client reasons (README "When it pauses" table against hooks/client.ts)',
        column(pauseTable, "Logged as").flatMap(spans),
        [...latch, ...skip],
      ),
    );
  }

  // 9. Eval script flags: each script's flags are the rows of its README option table.
  const evalOptions = [
    ["evals/run.mjs", "run.mjs option"],
    ["evals/compare.mjs", "compare.mjs option"],
    ["evals/crosscheck.mjs", "crosscheck.mjs option"],
  ];
  for (const [file, header] of evalOptions) {
    const table = findTable(sec("Evaluation"), header);
    if (table === undefined) {
      problems.push(`README "Evaluation" has no option table headed "${header}"`);
      continue;
    }
    const documented = column(table, header).map(flagOfCell).filter((flag) => flag !== null);
    problems.push(...assertSameSet(`${file} flags (README "${header}" table against the script)`, documented, flagsOf(read(file))));
  }

  // 10. Evaluation bars: the limits in evals/run.mjs and the judge model in
  //     evals/judge.ts are the ones the README bars table states.
  const run = read("evals/run.mjs");
  const harm = percent(constant(run, "HARM_LIMIT"));
  const benefit = constant(run, "BENEFIT_RATIO");
  const reliability = percent(constant(run, "RELIABILITY_LIMIT"));
  const hardShare = percent(constant(run, "HARD_CALIBRATION_SHARE"));
  const judgeModel = constString(read("evals/judge.ts"), "JUDGE_MODEL");
  need(judgeModel !== null, "no constant JUDGE_MODEL found in evals/judge.ts");
  const bars = findTable(sec("Evaluation"), "Bar");
  need(bars !== undefined, 'README "Evaluation" has no bars table headed "Bar"');
  if (bars !== undefined) {
    const limitOf = (bar) => bars.rows.find((row) => row[0] === bar)?.[2] ?? "";
    const barExpectations = [
      ["Judge", `at least ${hardShare}% of the hard pairs`, "HARD_CALIBRATION_SHARE"],
      ["Judge", `\`${judgeModel}\``, "JUDGE_MODEL"],
      ["Harm", `at most ${harm}%`, "HARM_LIMIT"],
      ["Benefit", `at least ${benefit} times`, "BENEFIT_RATIO"],
      ["Reliability", `at most ${reliability}%`, "RELIABILITY_LIMIT"],
    ];
    for (const [bar, text, name] of barExpectations) {
      need(limitOf(bar).includes(text), `README bars table: the ${bar} limit should say "${text}" (${name})`);
    }
  }

  const summary =
    `doc-parity: ${new Set(prefixes).size} log lines, ${reasons.length} gate reasons, ${expectations.length} quoted numbers, ` +
    `${evalExpectations.length} evaluation counts, ${guardReasons(guard).length + 1} guard reasons, ${latch.length + skip.length} client reasons, ` +
    `${evalOptions.length} eval flag tables and 5 evaluation bars match the README.`;
  return { problems, summary };
}

/**
 * Docs-kit entry point.
 *
 * @param {{ root?: string }} [context]
 * @returns {Promise<string[]>}
 */
export default async function docParity(context = {}) {
  return check(context.root ?? path.resolve(here, "..")).problems;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argRoot = process.argv.indexOf("--root");
  const root = argRoot === -1 ? path.resolve(here, "..") : path.resolve(process.argv[argRoot + 1] ?? ".");
  const { problems, summary } = check(root);
  if (problems.length > 0) {
    for (const p of problems) console.error(`DRIFT  ${p}`);
    console.error(`\n${problems.length} doc-parity problem(s).`);
    process.exit(1);
  }
  console.log(summary);
}
