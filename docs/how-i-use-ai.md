---
theme: default
title: From Chat to Engineering System
info: |
  How I think about using AI for software engineering
transition: slide-left
layout: cover
class: text-center
mdc: true
---


# From Chat to Engineering System

## How I think about using AI for software engineering

<!--
Opening: This is not a talk about a perfect prompt or a specific product. It is about a way of thinking before choosing the tools.
-->

---

layout: center
class: text-center
---

> # AI is not just a code generator.
>
> ## It is a new way to organize engineering work.

---

# From chat to agent

```text
Chat
  paste context → ask → copy answer → execute manually

Agent
  give goal + boundaries
  → investigate → act → verify
```

> **The model should do the mechanical work—not make me coordinate it manually.**

<!--
Example: Instead of pasting an error, then a file, then command output, I want the agent to locate the code, run the command, inspect the failure, and return evidence.
-->

---

layout: center
class: text-center
---

# Autonomy first

> **The model should investigate, execute, and verify—not make me transport information manually.**

Autonomy for investigation. Explicit authority for consequential actions.

**Example:** “Find why checkout fails. Gather evidence, but do not change code yet.”

---

# Copy and paste is integration debt

```text
Repeated manual transfer
        ↓
Missing access, tool, connector,
documentation, or retrieval capability
```

> **If I keep moving information manually, the harness is probably incomplete.**

**Example:** Instead of pasting a stack trace, the agent runs the failing test and opens the relevant source.

<!--
The point is not that copy and paste is always wrong. Repeated copy and paste is a signal that the human is acting as middleware.
-->

---

# My work begins with existing reality

```text
Architecture + history + constraints + technical debt
```

> **I use AI more to investigate existing systems than to generate new ones.**

**Example:** Why does the current system behave this way—and which part can be removed?

---

layout: center
class: text-center
---

# Simplify before adding

```text
Understand
→ find the real problem
→ reduce uncertainty
→ simplify
→ change
→ verify
```

> **AI should help reduce technical debt—not generate more code around it.**

**Example:** Remove duplicate validation instead of introducing a third abstraction around it.

---

# Experiment before optimizing

```text
Experiment
→ observe value
→ understand cost
→ remove recurring waste
```

> **Cost guardrails, not cost anxiety.**

Premature optimization can prevent discovery and innovation.

**Example:** Try a new review skill on three real changes before optimizing its token cost.

---

# AI changes the economics of evidence

```text
research + prototype + implementation
+ tests + cross-checks + real metrics
```

> **AI allows us to collapse phases without collapsing verification.**

**Example:** A feature slice can include contract checks, tests, and a real consumer-path verification—not only implementation.

---

# A follow-up prompt is telemetry

```text
Natural discovery?
Missing context?
Missing skill?
Weak documentation?
Harness limitation?
```

> **A systematic correction should improve the harness—not become a permanent prompting habit.**

**Example:** “You forgot the mobile consumer.” If this repeats, improve the review skill or project guidance.

---

# Execution errors create context debt

> **A reliable harness uses context for the task.**
>
> **An unreliable harness uses context to recover from itself.**

Subagents can isolate noise. They do not fix its cause.

**Example:** Five failed commands can displace the architecture details needed to solve the actual problem.

<!--
Errors and retries occupy the same context needed for architecture, evidence, decisions, and implementation state. They should be analyzed, even when hidden inside subagents.
-->

---

# Delegate execution, retain ownership

| Agents | Human |
| --- | --- |
| Investigate | Set direction |
| Implement | Judge tradeoffs |
| Test | Define authority |
| Verify | Validate the conclusion |

> **Delegate execution, but retain epistemic ownership.**

**Example:** The agent may implement the boundary; I must still explain why that boundary is correct.

---

# The unresolved risk

> **If AI performs the work, how do we preserve deep engineering judgment?**

I should still understand:

- the problem;
- the design and tradeoffs;
- the supporting evidence;
- the remaining uncertainty;
- how the system can fail.

The goal is to remove mechanical work—not judgment.

---

layout: center
class: text-center
---

# How does this become real?

## Model + harness + skills + feedback

---

# What is a coding harness?

```text
Model
  intelligence

Harness
  tools + context + permissions
  + execution loop + guardrails

Coding agent
  model operating through a harness
```

> **The model provides intelligence; the harness makes it operational.**

**Examples:** Copilot, Codex, Claude Code, OpenCode, OMP, Pi.

**Example:** The model selects a test command; the harness executes it and returns the exit status and output.

---

# Freedom and structure

```text
Too loose                         Too strict
errors and unsafe actions        rigid behavior and lost initiative
```

> **Structure the boundaries—not every step of the reasoning.**

Strong guardrails for risk. Freedom for investigation and problem-solving.

**Example:** Allow repository-wide reading; require confirmation before deleting a branch or deploying.

---

# Skills are on-demand expertise

```text
AGENTS.md
  general context + expectations + routing

Skills
  specialized procedures loaded by need
```

> **Skills turn permanent prompt bulk into on-demand expertise.**

**Examples:** debugging, brainstorming, review, TypeScript, verification.

**Example:** A reported bug loads debugging guidance. A real design ambiguity loads brainstorming.

---

# A concrete agent workflow

```text
Goal: investigate a production-facing failure

Agent reads the code and current state
→ reproduces or finds trustworthy evidence
→ compares hypotheses
→ proposes the smallest change
→ waits at the authority boundary
→ implements
→ verifies through the affected path
```

The human guides the decision—not every command.

---

# JSONL turns usage into evidence

| Local usage snapshot | Result |
| --- | ---: |
| Sessions analyzed | **107** |
| Investigation/verification signals | **50.5%** |
| Sessions with later user interaction | **87.6%** |
| Tool results from read, commands, and edit | **74.2%** |
| Visible skill loads | **4,858** |

> **I analyze how I actually use AI instead of relying only on memory.**

<!--
The categories overlap. Visible loads do not prove value, and tool-level errors do not equal task failures. The numbers are evidence about usage patterns, not a model leaderboard.
-->

---

# Autolearn creates candidates—not truths

```text
Real work
→ repeated procedure
→ candidate skill
→ review
→ keep, generalize, merge, or retire
```

> **Automatic learning discovers possibilities. Human judgment decides what becomes infrastructure.**

**Example:** A repeated branch-cleanup procedure becomes a candidate skill—not an automatic global rule.

---

# My current setup is not a prescription

```text
OMP
+ general agent instructions
+ market skills
+ my TypeScript skills
+ CLI tools and connectors
+ JSONL analysis
```

I learned selectively from Matt Pocock, Superpowers, Addy Osmani, ECC, Caveman, Ring, and others.

Now I am consolidating those lessons into my own agentic-coding skills.

---

# A path for beginners

```text
1. Start with chat and observe the model.
2. Give it safe read and command tools.
3. Record stable project expectations.
4. Move repeated procedures into skills.
5. Study corrections, failures, and retries.
6. Increase autonomy as the harness becomes reliable.
```

> **Start by removing one recurring source of manual work—not by building a framework.**

---

layout: center
class: text-center
---

> # Use AI to remove mechanical coordination.
>
> ## Keep human direction, authority, and judgment.

---

# Evidence notes

- Snapshot: 107 parseable root sessions, including 105 identifiable initial requests, from 2026-03-25 through 2026-08-07 UTC.
- Request categories are overlapping lexical signals, not exclusive semantic labels.
- A visible skill load does not prove that a skill was fully followed or produced value.
- Tool-level `isError` does not equal task failure.
- One session was a large load-count outlier; session reach is more reliable than raw load totals.
