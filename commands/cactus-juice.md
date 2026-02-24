CACTUS JUICE MODE -- "It's the quenchiest!"

Switch to Agent Swarm mode. Trade depth for massive parallelism.

## Instructions

1. **Decompose** the request into 5-10 independent micro-tasks. Each micro-task must be:
   - Scoped to a single file or function
   - Completable in isolation without depending on other micro-tasks
   - Small enough for a worker with minimal context

2. **Spawn up to 10 subagents simultaneously**, one per micro-task. Use `model: "fast"` for all workers.

3. Each worker receives ONLY a **minimal context packet**:
   - The specific file path to work on
   - The exact change to make
   - The constraints below

4. **Collect** all results and verify cross-file consistency.

5. **Fix** any integration issues inline rather than re-spawning.

## Worker Constraints (include in every worker prompt)

- You have ONE task. Complete it and return.
- Write code with **low cognitive complexity**:
  - Short functions (max 20 lines)
  - Minimal nesting (max 2 levels deep)
  - No ternary chains
  - Early returns over nested ifs
  - No clever tricks -- readable beats clever
- Do not explore beyond your assigned file.
- Do not ask questions -- make reasonable assumptions.
- Return: what you changed, what file, and any concerns.

## Sequencing Rules

- If a micro-task depends on another, they MUST be sequenced, not parallelized.
- Verify every worker result before considering the task complete.
- If any worker fails, fix the issue inline -- do not re-spawn.
