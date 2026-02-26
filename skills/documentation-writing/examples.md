# Documentation Writing - Examples and Templates

This file contains copy-paste ready templates and real-world examples for each documentation type.

## Template: Tutorial

````markdown
---
title: "Tutorial: [Topic]"
doc_type: tutorial
last_updated: YYYY-MM-DD
---

# Tutorial: [What You'll Build]

Brief description of what the reader will accomplish.

## What You'll Learn

- Skill 1
- Skill 2
- Skill 3

## Prerequisites

- Requirement 1
- Requirement 2

## Time Required

Approximately X minutes.

---

## Step 1: [First Action]

Brief context (1-2 sentences max).

```bash
# Command to run
actual-command --with-args
```
````

**Expected result**: Description of what should happen.

## Step 2: [Second Action]

Context sentence.

```python
# Complete, runnable code
def example():
    result = real_function()
    print(result)

# Run it
example()
```

**Checkpoint**: You should see `expected output`.

## Step 3: [Third Action]

Continue the pattern...

---

## Summary

What you accomplished:

- Achievement 1
- Achievement 2

## Next Steps

- [Advanced Topic](./advanced-topic.md)
- [Related Tutorial](./related-tutorial.md)

````

## Template: How-To Guide

```markdown
---
title: "How to [Accomplish Goal]"
doc_type: howto
last_updated: YYYY-MM-DD
---

# How to [Accomplish Goal]

One sentence describing what this guide helps you do.

## Prerequisites

- [ ] Prerequisite 1 completed
- [ ] Prerequisite 2 in place

## Steps

### 1. [Action Verb] [Thing]

```bash
command-to-run
````

### 2. [Action Verb] [Thing]

```python
code_to_execute()
```

### 3. [Action Verb] [Thing]

Final step with verification.

## Variations

### For [Variation A]

If your situation is X, do this instead:

```bash
alternative-command
```

### For [Variation B]

When Y applies, use:

```bash
another-alternative
```

## Troubleshooting

### [Common Problem 1]

**Symptom**: What the user sees.

**Solution**:

```bash
fix-command
```

### [Common Problem 2]

**Symptom**: Error message or behavior.

**Solution**: Explanation and fix.

## See Also

- [Related Reference](../reference/related.md)
- [Related How-To](./other-howto.md)

````

## Template: Reference

```markdown
---
title: "[Feature/API] Reference"
doc_type: reference
last_updated: YYYY-MM-DD
---

# [Feature/API] Reference

## Overview

Brief factual description of what this is.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VAR_NAME` | Yes | - | What it controls |
| `OTHER_VAR` | No | `default` | What it does |

### Configuration File

Location: `path/to/config.yaml`

```yaml
setting_name:
  option_a: value    # Description
  option_b: value    # Description
````

## API

### `function_name(param1, param2)`

Description of what this function does.

**Parameters**:

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `param1`  | string | Yes      | What it's for    |
| `param2`  | int    | No       | What it controls |

**Returns**: `ReturnType` - Description

**Raises**:

- `ValueError`: When invalid input
- `RuntimeError`: When operation fails

**Example**:

```python
result = function_name("input", 42)
print(result)
# Output: expected output
```

### `other_function()`

Same structure...

## Data Types

### `TypeName`

```python
@dataclass
class TypeName:
    field1: str      # Description
    field2: int      # Description
    field3: bool     # Description (default: True)
```

## Error Codes

| Code | Name           | Meaning             |
| ---- | -------------- | ------------------- |
| 100  | SUCCESS        | Operation completed |
| 400  | INVALID_INPUT  | Bad parameters      |
| 500  | INTERNAL_ERROR | System failure      |

## See Also

- [Tutorial: Getting Started](../tutorials/getting-started.md)
- [How-To: Common Tasks](../howto/common-tasks.md)

````

## Template: Explanation

```markdown
---
title: "Understanding [Concept]"
doc_type: explanation
last_updated: YYYY-MM-DD
---

# Understanding [Concept]

## What Is [Concept]?

Clear definition in 2-3 sentences.

## Why It Matters

Explain the significance and context. Why should the reader care?

## How It Works

### [Component 1]

Explanation of first major part...

### [Component 2]

Explanation of second major part...

## The Trade-offs

| Approach | Advantages | Disadvantages |
|----------|------------|---------------|
| Option A | Pro 1, Pro 2 | Con 1 |
| Option B | Pro 1 | Con 1, Con 2 |

## Historical Context

How did this concept evolve? What problems was it designed to solve?

## Common Misconceptions

### Misconception 1

What people often think, and what's actually true.

### Misconception 2

Another common misunderstanding and the reality.

## Comparison with Alternatives

How does this approach compare to other ways of solving the same problem?

| Feature | [Concept] | Alternative 1 | Alternative 2 |
|---------|-----------|---------------|---------------|
| Feature A | Yes | No | Partial |
| Feature B | Yes | Yes | No |

## When to Use This

- Situation 1
- Situation 2

## When NOT to Use This

- Situation where alternatives are better
- Edge cases where it doesn't apply

## Related Concepts

- [Related Concept 1](./related-1.md)
- [Related Concept 2](./related-2.md)

## Further Reading

- [External Resource](https://example.com)
````

## Real Example: Before and After

### Before (Poor Documentation)

```markdown
# Auth

You need to set up authentication.

First get a token then use it.

Example:
```

thing = do_auth(foo)

```

For more info see other docs.
```

### After (Good Documentation)

````markdown
---
title: "How to Set Up Authentication"
doc_type: howto
last_updated: 2025-11-25
---

# How to Set Up Authentication

Configure JWT authentication for API access.

## Prerequisites

- [ ] API key from [developer portal](https://portal.example.com)
- [ ] Python 3.10+ installed

## Steps

### 1. Configure Environment

```bash
export AUTH_API_KEY="your-api-key-here"  # pragma: allowlist secret
```

### 2. Initialize Authentication

```python
from amplihack.auth import Authenticator

auth = Authenticator()
token = auth.get_token()
print(f"Token: {token[:20]}...")
# Output: Token: eyJhbGciOiJIUzI1N...
```

### 3. Use Token in Requests

```python
import requests

response = requests.get(
    "https://api.example.com/data",
    headers={"Authorization": f"Bearer {token}"}
)
print(response.status_code)
# Output: 200
```

## Troubleshooting

### Token expired

**Symptom**: `401 Unauthorized` errors

**Solution**: Tokens expire after 1 hour. Call `auth.refresh_token()`.

## See Also

- [Authentication Reference](../reference/auth.md)
- [API Usage Guide](./api-usage.md)
````

## Example: Linking Documentation

### In `docs/index.md`

```markdown
# amplihack Documentation

## Getting Started

- [Installation](./tutorials/installation.md)
- [First Agent](./tutorials/first-agent.md)

## How-To Guides

- [Authentication Setup](./howto/authentication.md)
- [Deploy to Azure](./howto/azure-deploy.md)

## Reference

- [API Reference](./reference/api.md)
- [Configuration](./reference/config.md)

## Concepts

- [Architecture Overview](./concepts/architecture.md)
- [The Brick Philosophy](./concepts/brick-philosophy.md)
```

### Cross-Linking Between Docs

```markdown
# Tutorial: First Agent

...tutorial content...

## Next Steps

Now that you've built your first agent:

1. Learn about [authentication](../howto/authentication.md) to secure your agent
2. Read the [API reference](../reference/api.md) for all available methods
3. Understand [the brick philosophy](../concepts/brick-philosophy.md) for best practices
```

## Example: Avoiding Temporal Information

### Bad (Don't Do This)

```markdown
# Feature Update - November 2025

We're excited to announce that as of last week, we've completed
80% of the new authentication system. The team is working hard
and we expect to finish by end of month.

Current status:

- Login: Done
- Token refresh: In progress
- Logout: Not started
```

### Good (Do This Instead)

The temporal information goes in a GitHub Issue or PR:

**In GitHub Issue #123:**

```markdown
## Authentication System Implementation

### Status: In Progress

- [x] Login endpoint
- [ ] Token refresh
- [ ] Logout endpoint

**Target**: v2.0 release
```

**In `docs/reference/auth.md`:**

```markdown
# Authentication Reference

This document describes the authentication system.

## Available Endpoints

| Endpoint   | Status  | Description         |
| ---------- | ------- | ------------------- |
| `/login`   | Stable  | User authentication |
| `/refresh` | Beta    | Token refresh       |
| `/logout`  | Planned | Session termination |

> **Note**: Beta features may change. See [release notes](../releases.md).
```
