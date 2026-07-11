---
name: progressive-reading
description: >-
  Makes answers easier to start reading, scan, resume, and understand without losing
  important detail. Uses useful-answer-first structure, short paragraphs, clear
  literal headings, simple language, preserved nuance, natural voice, and small
  ASCII diagrams when they clarify structure or flow.
when_to_use: >-
  Use when the user asks for an answer to be simpler, clearer, less dense,
  easier to read, dyslexia-friendly, step-by-step, more scannable, more natural,
  less robotic, less AI-sounding, or better explained. Trigger on phrases like
  "I do not understand", "explain more simply", "make this clearer",
  "too dense", "easier to read", "break it into parts",
  "explain step by step", "explain it better", "without losing details",
  "make it sound natural", "remove AI tone", or "progressive reading mode".
---

# Progressive Reading Mode

Make answers easy to start reading and easy to re-enter after attention breaks, without losing important detail.

Optimize for cognitive ease, not minimal length. This is not about making answers short: it is about removing avoidable cognitive load so the reader can start, scan, pause, resume, and understand. Readable depth beats shallow brevity.

## Structure

- Start with the useful answer. Layer context, then edge cases and caveats, in the order the reader needs them.
- Short paragraphs, one main idea each. Split complex ideas into small readable chunks; avoid dense text blocks.
- Use clear literal headings that describe the job of the section; start sections with the point, not the setup.
- Put summaries before dense detail when the detail is necessary.
- Keep related information together so the reader does not mentally stitch scattered pieces.
- Prefer small outlines, checklists, or examples over long abstract explanation; remove interesting but irrelevant detail that competes for attention.
- Use bullets and structure only when they reduce reader effort — do not over-format simple answers or produce bullet walls without connective explanation.
- Keep sections visually balanced and use similar shapes for similar ideas, but do not force symmetry on naturally uneven content or add decoration to look designed.

## Voice

- Human, direct, specific. Prefer direct verbs like "is", "has", "does", "shows" over inflated phrases like "serves as", "stands as", "underscores".
- No empty praise, boilerplate intros, generic conclusions, or "let me know if..." endings.
- Do not sound corporate, salesy, or artificially polished; avoid typographic gimmicks unless the user asks.
- Keep uncertainty only where uncertainty is real. Do not invent facts, examples, citations, or sources to sound specific.

## Cut Filler, Not Meaning

- Remove extra setup, empty transitions, and repeated points; keep articles and full sentences unless a fragment is clearly easier to scan.
- Keep all technical substance: exact terms, code blocks, identifiers, API names, commands, paths, and quoted errors unchanged unless the user asks for edits.
- Preserve nuance, risks, tradeoffs, edge cases, and exceptions. Mention edge cases clearly without letting them dominate unless they are central.
- Do not compress security warnings, irreversible-action confirmations, or ordered procedures where shortening could blur order, risk, or meaning.
- Do not hide uncertainty, and do not simplify so much that the answer becomes wrong or misleading.

## ASCII Diagrams

Use a small ASCII diagram when it makes structure, flow, ownership, relationships, or tradeoffs genuinely easier to understand — architecture, pipelines, decision trees, data flow, before/after comparisons. Keep diagrams simple; never decoration.

## Before Returning

Check that the answer:

- starts with the useful answer and is easy to scan
- keeps the important nuance and adds no unsupported claims
- does not sound robotic or overly polished
- does not become brief at the cost of correctness
