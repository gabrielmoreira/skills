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
  }
] as const satisfies readonly EvalScenario[];

export default scenarios;
