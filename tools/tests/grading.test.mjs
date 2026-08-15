#!/usr/bin/env node
/**
 * The graders decide whether a model answer counts as a pass, so a defect here
 * is worse than a missing test: it reports a number that looks measured.
 *
 * Three of the four measurement defects found in this repository so far were in
 * the measuring code rather than in the thing measured, and every one of them
 * made a file look better without being better. These fixtures are the messy
 * answers a real model gives, not the tidy one the parser was written against.
 */
import { pathsIn, saidYes, gradeRouting, targetOf, isTestRun } from "../run-activation.mjs";
import { gateRows, naiveRoute, terms } from "../route-baseline.mjs";

let failed = 0;
const is = (label, got, want) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a === b) return;
  failed++;
  console.log(`  FAIL ${label}\n       got  ${a}\n       want ${b}`);
};

console.log("pathsIn");
is("one path", pathsIn("rules/watch-it-fail.md"), ["rules/watch-it-fail.md"]);
is("several, one per line", pathsIn("rules/watch-it-fail.md\nrules/smallest-green.md"), ["rules/watch-it-fail.md", "rules/smallest-green.md"]);
is("a topic index", pathsIn("typescript-async/INDEX.md"), ["typescript-async/INDEX.md"]);
is("the skill notation is stripped", pathsIn("skill://typescript-skills/typescript-async/INDEX.md"), ["typescript-async/INDEX.md"]);
is("prose around it, which the system prompt forbids and models produce anyway", pathsIn("I would open rules/watch-it-fail.md first."), ["rules/watch-it-fail.md"]);
is("a bulleted answer", pathsIn("- rules/a-b.md\n- rules/c.md"), ["rules/a-b.md", "rules/c.md"]);
is("repeats collapse", pathsIn("rules/a.md rules/a.md"), ["rules/a.md"]);
is("NONE names nothing", pathsIn("NONE"), []);
is("a bare word is not a path", pathsIn("watch-it-fail"), []);

console.log("saidYes");
is("yes", saidYes("YES"), true);
is("no", saidYes("NO"), false);
is("lowercase with a stop", saidYes("yes."), true);
is("padded", saidYes("\n  YES\n"), true);
is("explained anyway", saidYes("YES, because the developer is about to write code."), true);
is("refused", saidYes("I cannot determine that."), null);
// "NOTHING" starts with NO and would be read as a no by a looser parser.
is("a word starting with no is not a no", saidYes("NOTHING applies here"), null);

console.log("gradeRouting");
const one = { expectedPrimary: "rules/watch-it-fail.md", activation: { forbiddenRoutes: [] } };
is("exact", gradeRouting("rules/watch-it-fail.md", one).pass, true);
is("extra paths do not fail it", gradeRouting("rules/watch-it-fail.md\nrules/smallest-green.md", one).pass, true);
is("wrong rule", gradeRouting("rules/smallest-green.md", one).pass, false);
is("nothing", gradeRouting("NONE", one).pass, false);

const all = { expectedPrimary: "rules/a.md", expectedAll: ["rules/a.md", "rules/b.md"], activation: { forbiddenRoutes: [] } };
is("expectedAll needs every one", gradeRouting("rules/a.md", all).pass, false);
is("expectedAll satisfied", gradeRouting("rules/a.md\nrules/b.md", all).pass, true);

// typescript-skills writes its expectations in the skill:// notation.
// Removing the skill:// strip from normalise does not fail anything here, and
// that is correct rather than a hole: the segment-boundary rule in samePath
// already handles the prefix. The strip survives because it makes the reported
// expectation readable, which is cosmetic and untestable.
const deep = { expectedPrimary: "skill://typescript-skills/typescript-async/INDEX.md", activation: { forbiddenRoutes: [] } };
is("a skill:// expectation matches a plain answer", gradeRouting("typescript-async/INDEX.md", deep).pass, true);
// A suffix that does not start at a segment boundary is a different file.
is("a partial file name is not a match", gradeRouting("it-fail.md", one).pass, false);
is("a partial directory is not a match", gradeRouting("async/INDEX.md", deep).pass, false);

const forbidden = { expectedPrimary: "rules/a.md", activation: { forbiddenRoutes: ["rules/z.md"] } };
is("right rule, forbidden one too, still a failure", gradeRouting("rules/a.md\nrules/z.md", forbidden).pass, false);
is("forbidden reported by name", gradeRouting("rules/a.md\nrules/z.md", forbidden).violated, ["rules/z.md"]);

console.log("targetOf");
// Every tool names its target differently. Reading only args.path dropped each
// edit target and each command, and three outcome measures silently collapsed
// into one while still reporting numbers.
is("read and write carry path", targetOf({ path: "src/a.js", content: "x" }), { path: "src/a.js", cmd: "" });
is("edit carries a patch header", targetOf({ input: "[src/a.js#D61B]\nPUT 1*:\n+x" }), { path: "src/a.js", cmd: "" });
is("edit without a hash", targetOf({ input: "[src/a.js]\nPUT 1*:" }), { path: "src/a.js", cmd: "" });
is("bash carries a command", targetOf({ command: "npm test", cwd: "/w" }), { path: "", cmd: "npm test" });
is("nothing recognisable", targetOf({ pattern: "x" }), { path: "", cmd: "" });

console.log("isTestRun");
is("npm test", isTestRun("npm test"), true);
is("node --test", isTestRun("node --test src/"), true);
is("pytest", isTestRun("pytest -q"), true);
is("listing is not a test run", isTestRun("ls -la"), false);
is("a word containing test is not a test run", isTestRun("cat src/latest.js"), false);

console.log("naiveRoute");
const rows = gateRows([
  "| **a test about to be written** | `rules/watch-it-fail.md` |",
  "| **mocks, fixtures, or assertions** | `rules/tests-that-cannot-lie.md` |",
  "not a table line at all",
].join("\n"));
is("two rows parsed", rows.map((r) => r.target), ["rules/watch-it-fail.md", "rules/tests-that-cannot-lie.md"]);
is("a prompt quoting a row lands on it", naiveRoute(rows, "there are mocks and fixtures everywhere").target, "rules/tests-that-cannot-lie.md");
is("a prompt sharing nothing routes nowhere", naiveRoute(rows, "deploy the thing").target, null);

console.log("terms");
// Under five letters, so "test" and "app" are not distinctive enough to route on.
is("short words are dropped", [...terms("add a test to the app")], []);
is("hyphenated words survive", [...terms("watch-it-fail matters")], ["watch-it-fail", "matters"]);

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
