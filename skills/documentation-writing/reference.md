# Documentation Writing - Complete Reference

This file contains the complete specification for documentation writing including frontmatter, Diataxis definitions, and style conventions.

## YAML Frontmatter Specification

All substantial documentation files should include frontmatter:

```yaml
---
title: Document Title
description: One-sentence summary for search and discovery
last_updated: 2025-11-25
review_schedule: quarterly | monthly | as-needed
owner: team-name | username
doc_type: tutorial | howto | reference | explanation
---
```

### Required Fields

| Field         | Purpose                 | Example                          |
| ------------- | ----------------------- | -------------------------------- |
| `title`       | Document title          | "Authentication Setup Guide"     |
| `description` | Search-friendly summary | "Configure JWT auth for the API" |

### Optional Fields

| Field             | Purpose                 | Example                       |
| ----------------- | ----------------------- | ----------------------------- |
| `last_updated`    | Currency tracking       | "2025-11-25"                  |
| `review_schedule` | Maintenance schedule    | "quarterly"                   |
| `owner`           | Responsible party       | "platform-team"               |
| `doc_type`        | Diataxis classification | "howto"                       |
| `prerequisites`   | Required reading        | "[getting-started.md]"        |
| `related`         | Cross-references        | "[auth-config.md, tokens.md]" |

## Diataxis Framework - Complete Definitions

### Tutorials (Learning-Oriented)

**Purpose**: Take beginners through a complete learning experience.

**Characteristics**:

- Step-by-step progression
- Hands-on, doing-focused
- Minimal explanation (just enough to proceed)
- Clear success criteria at each step
- Building toward a complete outcome

**User mindset**: "I want to learn"

**Writing style**:

- Use "we" to include the reader
- Number each step clearly
- Include checkpoints ("You should now see...")
- Don't explain why, just show how

**Example structure**:

````markdown
# Tutorial: Building Your First Agent

## What You'll Build

A simple agent that responds to greetings.

## Prerequisites

- Python 3.10+
- API key configured

## Step 1: Create the Project

Create a new directory...

## Step 2: Write the Agent Code

```python
# ... complete, runnable code
```
````

## Step 3: Test Your Agent

Run: `python agent.py`
You should see: "Agent ready"

## Next Steps

Try [adding tools to your agent](./agent-tools.md).

````

### How-To Guides (Task-Oriented)

**Purpose**: Help experienced users accomplish a specific goal.

**Characteristics**:
- Addresses a real-world task
- Assumes existing competence
- Focused on the goal, not learning
- Practical and actionable
- Multiple paths possible

**User mindset**: "I need to do X"

**Writing style**:
- Direct, imperative tone
- Focus on the task, not background
- Include common variations
- Address likely complications

**Example structure**:
```markdown
# How to Deploy to Azure

This guide covers deploying amplihack to Azure Container Apps.

## Prerequisites
- Azure CLI installed
- Container registry configured

## Steps

### 1. Build the Container
```bash
docker build -t amplihack:latest .
````

### 2. Push to Registry

```bash
az acr login --name myregistry
docker push myregistry.azurecr.io/amplihack:latest
```

### 3. Deploy to Container Apps

```bash
az containerapp create \
  --name amplihack \
  --image myregistry.azurecr.io/amplihack:latest
```

## Troubleshooting

### Container fails to start

Check logs: `az containerapp logs show --name amplihack`

## See Also

- [Azure configuration reference](../reference/azure-config.md)

````

### Reference (Information-Oriented)

**Purpose**: Provide accurate, complete technical information.

**Characteristics**:
- Organized for lookup, not reading
- Complete and accurate
- Consistent structure
- No opinions or recommendations
- Austere and factual

**User mindset**: "I need to know the details"

**Writing style**:
- Neutral, descriptive tone
- Consistent formatting throughout
- Tables for structured data
- Complete parameter lists

**Example structure**:
```markdown
# API Reference: /api/v1/analyze

## Endpoint

`POST /api/v1/analyze`

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token |
| `Content-Type` | Yes | `application/json` |

### Body

```json
{
  "file_path": "string (required)",
  "options": {
    "depth": "integer (1-10, default: 3)"
  }
}
````

### Parameters

| Parameter       | Type    | Required | Default | Description     |
| --------------- | ------- | -------- | ------- | --------------- |
| `file_path`     | string  | Yes      | -       | Path to analyze |
| `options.depth` | integer | No       | 3       | Analysis depth  |

## Response

### Success (200)

```json
{
  "complexity": 12.5,
  "issues": []
}
```

### Errors

| Code | Meaning              |
| ---- | -------------------- |
| 400  | Invalid request body |
| 404  | File not found       |
| 500  | Internal error       |

````

### Explanation (Understanding-Oriented)

**Purpose**: Help readers understand concepts and context.

**Characteristics**:
- Provides background and context
- Explains "why" not "how"
- Connects concepts together
- Can include history and rationale
- Supports deeper understanding

**User mindset**: "I want to understand"

**Writing style**:
- Reflective, analytical tone
- Make connections explicit
- Use analogies and comparisons
- Discuss trade-offs and alternatives

**Example structure**:
```markdown
# Understanding the Brick Philosophy

## Why Modularity Matters

Traditional software development often leads to tightly coupled code...

## The LEGO Analogy

Like LEGO bricks, our modules have standardized connection points...

## Comparison with Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| Monolith | Simple start | Hard to maintain |
| Microservices | Independent | Complex infrastructure |
| Brick Philosophy | Balanced | Requires discipline |

## Historical Context

This philosophy emerged from observing AI-assisted development patterns...

## Trade-offs

Choosing the brick philosophy means accepting:
- Stricter module boundaries
- More upfront design effort
- But: easier regeneration and maintenance

## Related Concepts
- [Zero-BS Implementation](./zero-bs.md)
- [Regeneratable Code](./regeneratable.md)
````

## Markdown Style Conventions

### Headings

```markdown
# Title (H1) - One per document

## Major Section (H2) - Primary divisions

### Subsection (H3) - Secondary divisions

#### Detail (H4) - Rarely needed
```

### Code Blocks

Always specify the language:

````markdown
```python
def example():
    pass
```
````

````

Include expected output:

```markdown
```python
print("Hello")
# Output: Hello
````

````

### Links

Internal links use relative paths:
```markdown
See [authentication config](./auth-config.md)
````

External links include context:

```markdown
Based on [Anthropic's Agent SDK](https://docs.anthropic.com/agent-sdk)
```

### Admonitions

```markdown
> **Note**: Important information

> **Warning**: Potential issues

> **Tip**: Helpful suggestions
```

## Documentation Review Checklist

### Before Writing

- [ ] Identified document type (Diataxis)
- [ ] Chosen correct location in `docs/`
- [ ] Reviewed existing related docs
- [ ] Identified linking parent document

### During Writing

- [ ] Using plain, simple language
- [ ] Each section has a clear purpose
- [ ] Examples are real and runnable
- [ ] Headings are descriptive
- [ ] No temporal information included

### Before Submitting

- [ ] File is in `docs/` directory
- [ ] Linked from `docs/index.md` or parent
- [ ] Frontmatter included (for substantial docs)
- [ ] All code examples tested
- [ ] Spelling and grammar checked
- [ ] Relative links working

### After Submitting

- [ ] Verify links work in rendered view
- [ ] Check table of contents renders correctly
- [ ] Confirm search finds the document

## Token Budget Considerations

When writing documentation:

- Keep individual docs under 300 lines for best readability
- Split large docs into multiple files by topic
- Use links to reference related content
- Avoid duplicating information across docs
- Progressive disclosure: overview → details

## Common Mistakes to Avoid

| Mistake          | Problem          | Solution               |
| ---------------- | ---------------- | ---------------------- |
| Mixing doc types | Confuses readers | One type per file      |
| Generic examples | Not helpful      | Use real project code  |
| Missing context  | Orphan links     | Add descriptive text   |
| Outdated content | Misleading       | Review schedule        |
| Deep nesting     | Hard to navigate | Flatten structure      |
| Too much detail  | Overwhelming     | Progressive disclosure |
