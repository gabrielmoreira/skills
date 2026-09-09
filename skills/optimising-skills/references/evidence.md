# Evidence and transfer register

Reviewed 2026-09-05. URLs below are primary documents unless stated otherwise. Moving
web documentation is dated by retrieval, not treated as an immutable release. Local
acquisitions and the initial research are retained in the authorised ignored research
workspace; no private session data is required to reproduce the proposed coding pilot.

**Source statement is not independent replication.** Vendor recommendations, empirical
results on a stated benchmark, methods adapted from other domains, and local findings
are different evidence classes. A citation licenses only the claim it actually supports.

## Evaluation and experimental method

### OpenAI: Evaluation best practices

Source: <https://developers.openai.com/api/docs/guides/evaluation-best-practices>

- **Type/conditions:** current provider guidance for evaluating variable generative systems.
- **Statement:** define task-specific objectives, representative data and metrics; compare
  results, inspect logs and calibrate automatic scoring against human feedback. It warns
  against biased datasets, generic metrics and vibe-based evaluation.
- **Use here:** evaluation.md separates outcomes, task families, graders and repeated trials.
- **Limit:** example thresholds are examples, not validated thresholds for this collection.
  Provider guidance does not establish local skill lift.

### Anthropic: Demystifying evals for AI agents

Source: <https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents>

- **Type/conditions:** engineering guidance and examples of multi-turn agent evaluation.
- **Statement:** task, trial, grader, transcript, outcome and harness are different objects.
  An agent saying it booked a flight is not the same as the reservation existing. Multiple
  trials address variability; static graders can reject valid creative solutions.
- **Use here:** inspect produced artifacts and environment state; allow correct alternatives;
  distinguish agent harness from evaluation harness; retain trial-level evidence.
- **Limit:** the article is not an experiment on these skills or a universal grader recipe.

### SkillsBench

Source: <https://arxiv.org/abs/2602.12670> (Li et al., first submitted 2026-02-13;
current abstract retrieved 2026-09-05).

- **Type/conditions:** paired benchmark of curated skill packages against no-skills conditions.
  Current abstract describes 87 tasks, eight domains and 18 model-harness configurations.
- **Reported result:** average pass rate 33.9% without versus 50.5% with curated skills.
- **Use here:** compare actual task completion under controlled interventions rather than
  scoring Markdown structure. Keep the package and harness in the treatment definition.
- **Limit:** curated tasks/packages, versions and verifiers condition the result. The aggregate
  is not an estimate for this collection. An association with module count is not a universal
  cap on files, and a package effect does not isolate its prose from scripts or references.

### Automatic Prompt Optimization with "Gradient Descent" and Beam Search

Source: <https://arxiv.org/abs/2305.03495> (Pryzant et al., 2023-05-04).

- **Type/conditions:** prompt optimisation on three NLP benchmarks and jailbreak detection,
  using training data, natural-language criticism, edits, beam search and bandit selection.
- **Reported result:** preliminary improvements up to 31% over compared initial/editing settings.
- **Use here:** feedback can propose discrete candidates; keep generation, selection and final
  confirmation separate, and record every candidate comparison.
- **Limit:** the "gradient" is an analogy, not a differentiable skill objective or convergence
  proof. The tasks and older models do not establish gains for current coding skills. No
  beam-search infrastructure is necessary for a single justified semantic correction.

### Requirements and qualitative inspection

Sources: NASA, <https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/>;
Mayring (2000), <https://doi.org/10.17169/fqs-1.2.1089>.

- **Type:** methods already inspected in the original textual audit, not new local experiments.
- **Adaptation:** ask about necessity, clarity, consistency, assumptions and verifiability;
  define analysis units and coding criteria, preserve context and search counterevidence.
- **Limit:** a skill is not a NASA product requirement. The prior audit was single-model
  expert inspection, not a validated qualitative study or independent human replication.
  A fixed codebook reduces some discretion; it does not remove reviewer bias.

## Skills, tools and environment fidelity

### Qwen Code: Agent Skills

Source: <https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/>

- **Type/conditions:** current Qwen Code harness documentation.
- **Statement:** skills package instructions and optional resources; discovery uses metadata,
  while explicit invocation is a separate user action. Descriptions explain what and when.
- **Use here:** separate discovery from usefulness after loading, and test the actual harness's
  exposure behaviour. Keep supporting material on demand.
- **Limit:** Qwen-specific frontmatter and maintenance behaviour are not portable harness APIs.
  Do not add fields to this collection assuming every runtime implements them.

### Qwen-AgentWorld

Source: <https://qwen.ai/blog?id=qwen-agentworld>;
paper <https://arxiv.org/abs/2606.24597> (2026).

- **Type/conditions:** trained environment simulator and agent-training experiments across
  text and GUI domains. Ground-truth observations come from real environments.
- **Reported finding:** simulation fidelity and controlled perturbations matter; the MCP
  examples include intermittent errors, pagination, incomplete results and partial batches.
  The article explicitly treats simulation as complementary to real environments.
- **Use here:** fixtures specify real initial state and API semantics; perturb relevant failure
  schedules, then check important transitions in the actual runtime.
- **Limit:** RL gains and simulator benchmark scores are not evidence that a prompt rewrite
  helps. Do not substitute plausible generated tool responses for verified environment behaviour.

### NVIDIA NeMo Gym

Source: <https://github.com/NVIDIA-NeMo/Gym/blob/main/README.md>;
<https://docs.nvidia.com/nemo/gym/main/about/>.
README retrieved 2026-09-05, reporting v0.6.0 dated 2026-09-03 and skill evaluation/BLADE
introduced in v0.4.0 dated 2026-07-01.

- **Type/conditions:** environment infrastructure, not a causal result about local skill text.
- **Statement:** an environment comprises tasks, agent harness, verifier and per-task state.
  Supports repeated evaluation, stateful environments and stored rollout diagnostics.
  The README says a script may suffice for stateless checks without scale/training needs.
- **Use here:** define environment and verifier independently, preserve rollouts and choose
  modest instrumentation for the concrete pilot rather than installing a platform by default.
- **Limit:** BLADE or any diagnostic output still needs evidence for its attribution. The
  repository warns its APIs/documentation are evolving; a framework name does not validate a grader.

### Kimi: Dynamically Loaded Tools

Source: <https://platform.kimi.ai/docs/guide/use-dynamic-tool-loading>

- **Type/conditions:** current Kimi API protocol and supplier performance guidance.
- **Statement:** load tool definitions on demand; append definitions to preserve existing
  prefixes. Tool search is a backend-provided function, not a dedicated magic API.
- **Use here:** separate tool inventory, context cost, selection opportunities and cache layout;
  preserve the protocol when testing a content change.
- **Limit:** reported accuracy/cost benefits are not a measured local effect. Other providers
  may use different tool-discovery and caching protocols. Do not universalise "append".

## Reasoning protocols are not interchangeable

### GLM / Z.ai: Thinking Mode

Source: <https://docs.z.ai/guides/capabilities/thinking-mode>

- **Type/conditions:** interleaved, preserved and turn-level thinking documentation; examples
  include GLM-4.7. Endpoint defaults differ between Coding Plan and standard API.
- **Statement:** preserved thinking uses complete, unmodified historical reasoning content;
  the documented control includes clear_thinking=false. Order matters.
- **Use here:** identify a protocol/harness fault before editing skill prose.
- **Limit:** continuity and performance claims remain provider-specific, not a rule to expose
  or retain private reasoning in every application.

### Google Gemma: Thinking mode

Source: <https://ai.google.dev/gemma/docs/capabilities/thinking>

- **Type/conditions:** current Gemma thinking conversation-format documentation.
- **Statement:** strip previous-turn thoughts before the next user turn in standard multi-turn
  use, but do not remove them between function calls within one model turn.
- **Use here:** retain the distinction between user-turn boundaries and an ongoing tool loop.
- **Limit:** this differs from preserved-thinking protocols. Neither source should be rewritten
  into a cross-model rule to always preserve or always remove reasoning.

### DeepSeek: Thinking Mode

Source: <https://api-docs.deepseek.com/guides/thinking_mode>

- **Type/conditions:** current API guide, including deepseek-v4-flash/pro examples.
- **Statement:** with tools, historical reasoning_content must be passed back; without tools,
  previous reasoning is ignored. Some sampling controls have no effect in thinking mode.
- **Use here:** record effective controls, not only requested flags, and distinguish provider
  message-protocol validity from instruction quality.
- **Limit:** this verifies the documented protocol, not claims about a separate DeepSeek agent
  harness or transfer to another vendor. No private reasoning collection is required here.

### MiniMax: Text generation

Source: <https://platform.minimax.io/docs/guides/text-generation>

- **Type/conditions:** current model/API overview, naming MiniMax-M3 and historical M2 variants.
- **Statement:** documents an Anthropic-compatible path supporting thinking blocks and
  interleaved thinking, alongside other interfaces.
- **Use here:** record the interface and model, not just the vendor label, in an experiment.
- **Limit:** interface support and context capacity do not demonstrate instruction adherence
  or a particular skill-optimisation technique. No local MiniMax comparison was performed.

### Unsloth: Fine-tuning guide

Source: <https://unsloth.ai/docs/get-started/fine-tuning-guide>

- **Type/conditions:** SFT, LoRA/QLoRA and RL training guidance; not inference-only prompting.
- **Statement:** dataset structure, validation and training choices affect learned behaviour;
  automated evaluation may not align with the user's criteria.
- **Use here:** distinguish training reward from the outcome actually wanted, and audit proxy
  metrics for gaming. Preserve unrelated capabilities when optimising a target behaviour.
- **Limit:** training changes weights/adapters. Those effects do not establish that adding or
  removing a Markdown instruction has the same effect. Dataset proportions are not universal defaults.

## Local evidence and unresolved claims

The initial audit found textual contradictions and over-scoped requirements. It did not run
these skills. The historical attempt record contains local failures and inconclusive comparisons;
its small samples do not eliminate whole classes of wording interventions.

The TypeScript pilot begins from the audited concurrent-promise example. Primary semantics:
<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function>.
MDN explicitly shows that a concurrently started promise can reject before a later await
wires it into the chain, even with an outer catch. Runtime reproduction establishes that
example defect; a controlled coding comparison is needed to establish any guidance benefit.

No source above proves this optimisation method universally effective. Apparent convergence
is a reason to test a hypothesis, not a substitute for independent outcome evidence. Contradictory
provider protocols stay visible rather than being averaged into one recommendation.
