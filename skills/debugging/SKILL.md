---
name: debugging
description: Systematic 4-phase debugging with root cause investigation. Use when fixing bugs to prevent random fixes.
version: 1.1.1
model: sonnet
invoked_by: both
user_invocable: true
tools: [Read, Write, Edit, Bash, Glob, Grep]
best_practices:
  - Investigate root cause before any fix
  - Reproduce the bug reliably first
  - Compare working vs broken examples
  - Make one change at a time
error_handling: strict
streaming: supported
verified: true
lastVerifiedAt: 2026-02-22T00:00:00.000Z
---

**Mode: Cognitive/Prompt-Driven** — No standalone utility script; use via agent context.

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## Iron Laws

1. **NEVER** propose or implement a fix before completing Phase 1 root cause investigation — a fix without root cause is a guess that will fail or create new bugs.
2. **ALWAYS** reproduce the bug reliably before debugging — if you can't reproduce it consistently, you're not debugging the real issue.
3. **NEVER** make more than one change at a time when testing a hypothesis — multiple simultaneous changes make it impossible to determine which change fixed the problem.
4. **ALWAYS** stop and question the architecture after 3 failed fix attempts — if each fix reveals a new problem, the issue is architectural, not symptomatic.
5. **NEVER** skip creating a failing test case before implementing the fix — without a test, you cannot verify the fix worked or that it won't regress.

## When to Use

## When to Use

Use for ANY technical issue:

- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**

- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**

- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## When to Use: debugging vs smart-debug

| Scenario                             | Use `debugging` | Use `smart-debug` |
| ------------------------------------ | --------------- | ----------------- |
| Simple, locally reproducible bug     | Yes             | Overkill          |
| Root cause area already known        | Yes             | Optional          |
| Static analysis / code review bug    | Yes             | No                |
| Runtime / production issue           | Start here      | Preferred         |
| Intermittent / hard-to-reproduce     | Escalate        | Yes               |
| Needs hypothesis ranking gate        | No              | Yes (blocking)    |
| Needs instrumentation + log analysis | No              | Yes               |
| Observability-driven (traces, APM)   | No              | Yes               |

**Rule of thumb**: Start with `debugging` for straightforward bugs. Escalate to `smart-debug` when you need hypothesis ranking, structured instrumentation, or the bug is intermittent/production-only.

**See also**: `.claude/skills/smart-debug/SKILL.md`

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible - gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (CI - build - signing, API - service - database):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**

   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Example (multi-layer system):**

   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **This reveals:** Which layer fails (secrets - workflow OK, workflow - build FAIL)

   **For distributed/microservice systems — prefer OpenTelemetry traces:**

   ```bash
   # Query traces by component (preferred over manual echo/env logging)
   pnpm trace:query --component <service-name> --event <event-name> --since <ISO-8601> --limit 200

   # When trace ID is already known
   pnpm trace:query --trace-id <traceId> --compact --since <ISO-8601> --limit 200
   ```

   **Fragmented traces** (each service has its own root span, trace IDs don't match across boundaries)
   = broken context propagation. Fix `traceparent`/`tracestate` header forwarding before investigating business logic.

   > **Instrumentation Gate (before hypothesis generation):** If runtime behavior remains unclear after static analysis, add targeted log statements at key decision nodes before generating hypotheses. Use session-scoped log files (`.claude/context/tmp/debug-{sessionId}.log`) to capture runtime state. Human-in-the-loop: ask the user to reproduce the bug after instrumentation is added, before analyzing results. Only proceed to Phase 2 once runtime evidence is collected.

5. **Trace Data Flow**

   **WHEN error is deep in call stack:**

   See `root-cause-tracing.md` in this directory for the complete backward tracing technique.

   **Quick version:**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - If implementing pattern, read reference implementation COMPLETELY
   - Don't skim - read every line
   - Understand the pattern fully before applying

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small
   - Don't assume "that can't matter"

4. **Understand Dependencies**
   - What other components does this need?
   - What settings, config, environment?
   - What assumptions does it make?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Write it down
   - Be specific, not vague

2. **Test Minimally**
   - Make the SMALLEST possible change to test hypothesis
   - One variable at a time
   - Don't fix multiple things at once

3. **Verify Before Continuing**
   - Did it work? Yes - Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

4. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Ask for help
   - Research more

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - Automated test if possible
   - One-off test script if no framework
   - MUST have before fixing
   - Use the `tdd` skill for writing proper failing tests

2. **Implement Single Fix**
   - Address the root cause identified
   - ONE change at a time
   - No "while I'm here" improvements
   - No bundled refactoring

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?
   - Issue actually resolved?

4. **Cleanup**
   - Remove all instrumentation added for this debug session (log statements, temporary diagnostics)
   - Verify cleanup: grep for the session debug ID or instrumentation markers to confirm no debug artifacts remain in production code
   - Example: `rg "debug-{sessionId}" --type-add 'src:*.{js,ts,cjs,mjs}' -tsrc .`

5. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If >= 3: STOP and question the architecture (step 6 below)**
   - DON'T attempt Fix #4 without architectural discussion

6. **If 3+ Fixes Failed: Question Architecture**

   **Pattern indicating architectural problem:**
   - Each fix reveals new shared state/coupling/problem in different place
   - Fixes require "massive refactoring" to implement
   - Each fix creates new symptoms elsewhere

   **STOP and question fundamentals:**
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs. continue fixing symptoms?

   **Discuss with your human partner before attempting more fixes**

   This is NOT a failed hypothesis - this is a wrong architecture.

## Red Flags - STOP and Follow Process

If you catch yourself thinking:

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5)

## Your Human Partner's Signals You're Doing It Wrong

**Watch for these redirections:**

- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultrathink this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

## Common Rationalizations

| Excuse                                       | Reality                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| "Issue is simple, don't need process"        | Simple issues have root causes too. Process is fast for simple bugs.    |
| "Emergency, no time for process"             | Systematic debugging is FASTER than guess-and-check thrashing.          |
| "Just try this first, then investigate"      | First fix sets the pattern. Do it right from the start.                 |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it.                       |
| "Multiple fixes at once saves time"          | Can't isolate what worked. Causes new bugs.                             |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely.              |
| "I see the problem, let me fix it"           | Seeing symptoms does not equal understanding root cause.                |
| "One more fix attempt" (after 2+ failures)   | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Quick Reference

| Phase                 | Key Activities                                         | Success Criteria            |
| --------------------- | ------------------------------------------------------ | --------------------------- |
| **1. Root Cause**     | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY     |
| **2. Pattern**        | Find working examples, compare                         | Identify differences        |
| **3. Hypothesis**     | Form theory, test minimally                            | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify                               | Bug resolved, tests pass    |

## When Process Reveals "No Root Cause"

If systematic investigation reveals issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

**But:** 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

These techniques are part of systematic debugging and available in this directory:

- **`root-cause-tracing.md`** - Trace bugs backward through call stack to find original trigger
- **`defense-in-depth.md`** - Add validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling
- **find-polluter** - For test pollution bisection (flaky tests due to shared state): run `.claude/tools/analysis/find-polluter/find-polluter.sh` (or `find-polluter.ps1` on Windows) from the project root to isolate which test pollutes the suite.

**Related skills:**

- **tdd** - For creating failing test case (Phase 4, Step 1)
- **verification-before-completion** - Verify fix worked before claiming success

## Real-World Impact

From debugging sessions:

- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

## AI-Assisted Debugging & Modern Observability (2025+)

### OpenTelemetry: The New Stack Trace

For distributed systems, OpenTelemetry traces replace manual `echo`/`env` evidence gathering. A trace shows the complete request journey across service boundaries via span IDs and trace IDs (W3C Trace Context standard: `traceparent`/`tracestate` headers).

**Evidence hierarchy for distributed failures (prefer in order):**

```
1. Distributed traces (OpenTelemetry spans, correlated trace IDs)
2. Structured logs with correlation IDs
3. Metrics with timestamps
4. Manual instrumentation (Phase 1 Step 4 bash examples)
```

**Common symptom — fragmented traces:**
Each service shows its own root span, trace IDs don't match across boundaries. This means context propagation is broken — fix header forwarding before investigating business logic.

### AI-Assisted Root Cause Analysis

LLM-based debugging agents (2025 pattern) augment Phase 1 by reading production traces and correlating with codebase context to suggest minimal reproduction cases.

**Use AI assistance for:**

- High-complexity distributed failures with multi-service blast radius
- On-call incidents requiring rapid root cause identification
- Converting production traces into deterministic test reproducers

**Do NOT skip Phase 1** when using AI assistance. AI suggestions are hypotheses — apply Phase 3 (hypothesis testing) before implementing any AI-suggested fix. AI cannot replace systematic investigation; it accelerates evidence gathering.

## Anti-Patterns

| Anti-Pattern                                 | Why It Fails                                                                      | Correct Approach                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| "Quick fix for now, investigate later"       | The quick fix becomes permanent; the root cause resurfaces as a different symptom | Always complete Phase 1 before touching production code              |
| Making multiple changes at once              | Can't determine which change fixed or broke the system; creates regressions       | One change per hypothesis test; verify before the next change        |
| Proposing AI-suggested fixes without testing | AI suggestions are hypotheses, not facts; applying them blindly skips Phase 3     | Treat AI suggestions as hypotheses to test, not answers to implement |
| Attempting a 4th fix after 3 failures        | N+1 fix attempts on a broken approach compound the problem                        | After 3 failed fixes, escalate to architecture review                |
| Skipping the failing test before the fix     | You can't verify the fix worked, and regressions are invisible                    | Create the failing test first; it proves root cause and verifies fix |

## Memory Protocol (MANDATORY)

**Before starting:**
Read `.claude/context/memory/learnings.md`

**After completing:**

- New pattern -> `.claude/context/memory/learnings.md`
- Issue found -> `.claude/context/memory/issues.md`
- Decision made -> `.claude/context/memory/decisions.md`

> ASSUME INTERRUPTION: If it's not in memory, it didn't happen.
