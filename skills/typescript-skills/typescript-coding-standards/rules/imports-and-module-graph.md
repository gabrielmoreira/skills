---
id: typescript-coding-standards.imports-and-module-graph
owner: typescript-coding-standards
canonical: true
severity: default
references: [ESM/CommonJS interop (Node), import type (TypeScript Handbook), package entry points and exports field]
---

# Imports and Module Graph

Decision: **Keep the import list a true statement of what the file depends on.** Every import resolves, is used, and comes from the module system the package declares. How long an old path survives belongs to `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md`.

Use when:
- **A module will not resolve**, or a named export is missing from one that does.
- **An import is present and nothing in the file uses it.**
- **`require` appears in a file the package compiles as ESM**, or a default import is taken against a CommonJS module without interop.
- **A path reaches into another package's file layout** rather than its published entry.

Do:
- **Remove an unused import in the change that made it unused.**
- **Fix an unresolved module at its cause.** A missing dependency, a wrong path, a `paths` mapping the runtime does not share, or an export the package never published.
- **Import from a package's public entry.**
- **Keep one module system per package**, and let a boundary do interop where a dependency is CommonJS.
- **Use `import type` for type-only imports**, so the emitted graph matches the runtime one.

Avoid:
- **Silencing an unresolved module** with a wildcard declaration or `any`.
- **Keeping an import for now.** It survives, and the next reader treats it as a real dependency.
- **A deep path into another package** taken as a shortcut.
- **An alias the build resolves and the test runner does not.**

Exceptions:
- **A side-effect import MAY have no binding**, for a polyfill or a registration, where a comment says so.
- **A generated file MAY carry unused imports** where regeneration owns its contents.

Example (one instance, not the set):

```ts
// Type-only, so nothing survives into the emitted graph.
import type { Invoice } from "@acme/billing";

// Side effect, deliberately without a binding.
import "./register-serializers";
```

Verify:
- **Check every import is used**, or is a documented side-effect import.
- **Check no unresolved module was silenced** rather than resolved.
- **Check an alias resolves identically in build, test, and runtime.**
