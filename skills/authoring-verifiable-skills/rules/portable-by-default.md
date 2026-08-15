---
id: authoring-verifiable-skills.portable-by-default
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [portability failures found across two collections]
---

# Portable By Default

Decision: **A skill installs onto machines whose setup the author has never seen, so instruction prose MUST NOT name any of these.**

- A machine path.
- A URL.
- A package manager.
- A CI vendor.
- A company or product.

Use when:
- **A skill is written on one machine** and will run on others.
- **A rule names a tool** rather than the job that tool does.
- **A path, a handle, or an internal address has been pasted in.**
- **A skill is moving between repositories**, where local assumptions travel with it.

Do:
- **Name the job, not the tool.** "The project's declared test command" travels; a runner's name does not.
- **Name the artifact, not its location.** "The configured tracker" travels; a URL does not.
- **Keep concrete detail in the example**, where being specific is the point.
- **Keep citations in `references:`**, which exists to name outside sources.
- **Let a skill whose subject is one ecosystem name that ecosystem**, and say so in its scope.
- **Where a skill writes a file, resolve the location rather than declare it.** What the request named, then what the instruction file declares, then a directory that already exists. Report the path and whether it is tracked.
- **Check for a leaked path everywhere.** A path is a leak inside an example too.

Avoid:
- **A user directory, a home path, or a drive letter.** These identify one machine.
- **An embedded URL in prose.** A loopback or documentation host is fine; anything else couples.
- **A company or product name in an instruction.** In an example it illustrates. In an instruction it is a dependency.
- **A personal handle**, which dates the file and may not stay reachable.
- **Assuming a package manager.** The repository already declares which one it uses.

Exceptions:
- **An example MAY name a real provider**, where the rule is about containing that provider's vocabulary.
- **A `references:` entry MAY name a company**, because it is a citation rather than an instruction.

Example (one instance, not the set):

| Instead of | Write |
| --- | --- |
| a named package manager plus install | the project's declared install command |
| a specific CI product's file | the repository's pipeline definition |

Verify:
- **Read the instruction prose with frontmatter and code fences removed.** That is where coupling matters.
- **Search for a drive letter, a home path, and an embedded URL across the whole file**, examples included.
- **Ask whether the rule works on a machine you have never seen.** Where the answer needs a name, that name is a dependency.
