Use Katara (the healer agent) for methodical debugging and code healing.

1. **Assess** the codebase state and identify the root cause (not symptoms).
2. **Plan** the minimal fix required -- do NOT refactor while fixing.
3. **Execute** the fix with disciplined verification at every step.
4. **Verify** with ReadLints, build, and tests. Provide evidence of each check.

If the fix fails after 3 attempts, stop, revert, document what was tried, and ask for guidance.
