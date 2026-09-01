import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "security-localhost-fallback-bypass",
    bundle: "typescript-security",
    rule: "secrets-lifecycle",
    tier: "P0",
    mode: "bypass",
    difficulty: "mixed",
    prompt:
      "PR adds `const paymentsUrl = process.env.PAYMENTS_URL ?? 'http://localhost:4000';` in the payments client. Author says every dev runs the stub locally and prod always sets the var through the deploy pipeline, so the fallback can never leak. Approve?",
    expectedPrimary: "typescript-security",
    expectedSecondary: ["typescript-configs"],
    must: [
      "Rejects the endpoint fallback as a hard-gate violation",
      "Applies the production-correctness criterion: if the value missing would not be production-correct, it must be required, not defaulted",
      "Does not accept the deploy-pipeline safety-net argument",
      "Points local dev to explicit local config (e.g. .env or local overrides) instead of a code default"
    ],
    mustNot: [
      "Approves because the fallback is only localhost or only for dev",
      "Treats this as a general non-secret default question"
    ],
    tags: ["hard-gate", "fallback", "p0"]
  },
  {
    id: "security-ambiguous-secure-boolean",
    bundle: "typescript-security",
    rule: "crypto-choices",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Our helper is `encryptPayload(data: string, secure: boolean)`. When `secure` is true it uses AES-256-GCM, when false a legacy XOR scramble kept for an old integration. New callers keep passing `false` by accident. How should this API change?",
    expectedPrimary: "typescript-security",
    must: [
      "Rejects the ambiguous `secure: boolean` flag and asks for explicit, named crypto choices",
      "Suggests making the algorithm/mode explicit in the API (e.g. named functions or a required literal mode)",
      "Flags the weak legacy path so callers cannot select it silently by default"
    ],
    mustNot: [
      "Keeps the boolean and just flips the default",
      "Treats this as a pure naming/style question with no security weight"
    ],
    tags: ["crypto", "explicit-choice", "p1"]
  },
  {
    id: "security-token-in-error-log",
    bundle: "typescript-security",
    rule: "redaction",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "To debug flaky auth we added `logger.error('auth failed', { requestHeaders: req.headers, config })` in the catch block. It has been very useful, we can finally see what differs between failing and passing requests. Any concerns before we leave it in?",
    expectedPrimary: "typescript-security",
    expectedSecondary: ["typescript-observability"],
    must: [
      "Flags that raw headers and config objects carry tokens/credentials/secrets into logs",
      "Requires redaction or an explicit allowlist of safe fields instead of logging whole objects",
      "Preserves the diagnostic goal by suggesting safe, meaningful fields to log instead"
    ],
    mustNot: [
      "Approves keeping full headers/config in logs because it is useful for debugging",
      "Suggests only lowering the log level as the fix"
    ],
    tags: ["redaction", "logs", "p0"]
  },
  {
    id: "security-secret-pointer-vs-value",
    bundle: "typescript-security",
    rule: "secrets-lifecycle",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "We load config at startup with a zod schema. Someone proposed adding `DB_PASSWORD` to that same schema so 'all config lives in one place'. Others say the schema should only hold `DB_PASSWORD_SECRET_ARN` and the value gets fetched later. Which side is right?",
    expectedPrimary: "typescript-security",
    expectedSecondary: ["typescript-configs"],
    must: [
      "Distinguishes secret source pointers (config) from secret values (fetched later at the security boundary)",
      "Keeps secret values out of the broad parsed config object that flows through the app",
      "Explains the exposure risk of secret values living in widely passed config (logs, serialization, snapshots)"
    ],
    mustNot: [
      "Treats the password value as ordinary config because the schema validates it",
      "Rejects the pointer-in-config approach as equally dangerous"
    ],
    tags: ["secrets", "pointer-vs-value", "p1"]
  },
  {
    id: "token-in-the-repo-since-forever",
    bundle: "typescript-security",
    rule: "secrets-lifecycle",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "What do we do about this? There is an API token in a committed config file, it is in the history, and it still works.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/secrets-lifecycle.md"],
    expectedSecondary: [],
    must: [
      "Treats the live credential as needing rotation, not only removal",
      "Separates removing it from the working tree from removing it from history"
    ],
    mustNot: [
      "Deletes the line and considers it handled"
    ],
    tags: ["real-world", "committed-secret"]
  },
  {
    id: "reading-the-secret-at-import-time",
    bundle: "typescript-security",
    rule: "secrets-lifecycle",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why does the test suite need real credentials? The module reads the secret when it loads, so importing it anywhere pulls the value in.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/secrets-lifecycle.md"],
    expectedSecondary: ["typescript-configs", "typescript-testing"],
    must: [
      "Moves the read to where the value is used rather than to import time",
      "Connects import-time reads to the testing pain"
    ],
    mustNot: [
      "Adds fake credentials to the test environment and leaves the import-time read"
    ],
    tags: ["real-world", "import-time-read"]
  },
  {
    id: "customer-email-in-the-error-we-return",
    bundle: "typescript-security",
    rule: "redaction",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Review this before it ships. The validation error we return names the field and includes the value the customer sent, which for one path is their email.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/redaction.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Keeps the diagnostic useful without echoing the value",
      "Distinguishes what the caller needs from what an operator needs"
    ],
    mustNot: [
      "Removes the field name too, leaving an error nobody can act on"
    ],
    tags: ["real-world", "pii-echo"]
  },
  {
    id: "which-hash-for-these-tokens",
    bundle: "typescript-security",
    rule: "crypto-choices",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Which hash should we use here? These are short-lived download tokens, we generate a few thousand a minute, and someone suggested MD5 because it is fast.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/crypto-choices.md"],
    expectedSecondary: [],
    must: [
      "Chooses from what the value protects rather than from speed",
      "Names the property the token actually needs"
    ],
    mustNot: [
      "Accepts MD5 because the tokens are short-lived"
    ],
    tags: ["real-world", "wrong-primitive"]
  },
  {
    id: "random-for-a-reset-link",
    bundle: "typescript-security",
    rule: "crypto-choices",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Is `Math.random()` fine for this? It is a password reset link, and the value is only valid for fifteen minutes.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/crypto-choices.md"],
    expectedSecondary: [],
    must: [
      "Requires an unpredictable source for a value that grants access",
      "Treats the short window as not making prediction acceptable"
    ],
    mustNot: [
      "Accepts it because the token expires quickly"
    ],
    tags: ["real-world", "pseudo-random", "measured-shape"]
  },
  {
    id: "redact-everything-and-be-safe",
    bundle: "typescript-security",
    rule: "redaction",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Can we just redact every field? After the last incident the security team wants nothing identifiable in logs at all, and on-call says they will not be able to debug anything.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/redaction.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Distinguishes an identifier that supports debugging from the value that identifies a person",
      "Offers a shape that satisfies both rather than picking a side"
    ],
    mustNot: [
      "Redacts correlation identifiers along with personal data"
    ],
    tags: ["adversarial", "post-incident-pressure"]
  },
] as const satisfies readonly EvalScenario[];

export default scenarios;
