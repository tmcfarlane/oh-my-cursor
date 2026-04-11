---
name: cursor-image-generation
description: Generate and iterate images in Cursor using the built-in image model and strong prompts. Use when creating icons, illustrations, UI mockups, diagrams, marketing visuals, or any raster asset from a text description or reference image.
metadata:
  author: oh-my-cursor
  version: "1.0.0"
---

# Cursor image generation (Nano Banana Pro)

Generate images in the **Cursor agent** using the **GenerateImage** tool. Image generation is backed by **Google Nano Banana Pro**. Previews are saved under **`assets/`** by default unless you specify otherwise.

This skill is about **prompting** and **workflow**, not about replacing Figma or vector code (use other skills for those).

## Rough prompt in, strong prompt out

The user may give a **short or vague** request (“a hero for the login page”, “cyberpunk icon”). **Do not** pass that string raw to **GenerateImage** when it lacks the layers this skill describes. Instead:

1. **Infer or ask** for missing constraints (medium, aspect ratio, style, brand colors, text to render).
2. **Rewrite** the ask into one structured prompt (or a tight second pass) using the principles below.
3. **Call GenerateImage** with the rewritten prompt only.

The skill is the contract: the agent’s job is to **expand and sharpen** the user’s intent before generation, then **iterate** with deltas.

## When to use this skill

- User asks for an **image**, **icon**, **hero visual**, **diagram look**, **mockup still**, or **iteration** on an existing generated image.
- You need **text in the image** (titles, labels, buttons in a mockup).
- User uploads a **reference image** and wants a variation or edit-style direction.

## Core principles (Nano Banana / Gemini image family)

The bullets below are a **condensed synthesis** of common guidance for Nano Banana Pro / Gemini image models — not verbatim quotes. For authoritative wording and edge cases, use the **References** below.

They align with the spirit of Google’s public guides ([prompt tips](https://blog.google/products/gemini/prompting-tips-nano-banana-pro), [Google Cloud guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana), [DeepMind prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/)):

1. **Brief a human artist** — Use clear, grammatical sentences. Avoid keyword soup (`"cyber, 4k, hdr, epic"`) unless you deliberately want a tag-like aesthetic.
2. **Layer the description** — Subject → action/pose → environment → **camera** (wide shot, isometric, macro) → **lighting** (soft window light, neon rim, overcast) → **materials** (brushed aluminum, matte paper, glass) → **style** (editorial photo, flat illustration, low-poly 3D render).
3. **Text in images** — Put exact wording in **double quotes** and specify typography feel (e.g. `"bold geometric sans"`, `"narrow serif for headlines"`). Ask for legibility and high contrast if the text is important.
4. **Aspect ratio and framing** — State **orientation** (square, 16:9 landscape, 9:16 story) and **safe margins** if the asset will be cropped (e.g. app icon: centered subject, padding).
5. **Edit, don't always re-roll** — If the image is roughly right, ask for **specific changes** (`"change the background to warm beige"`, `"make the logo 20% larger"`, `"remove the extra person on the left"`) instead of a full new prompt.
6. **Reference images** — When the user supplies a reference, describe **what to keep** (palette, mood, composition) and **what to change** so the model does not drift.

## Anti-patterns

- Vague superlatives with no visual anchor: “make it more beautiful / premium / modern” — always attach **concrete** cues (materials, palette, era, reference).
- Contradictory constraints in one shot: “minimalist” + “dense infographic” + “single hero object” — split into **steps** or iterations.
- Ignoring the **use case**: icon vs hero vs print — state **target size** or **viewing distance** when it matters.

## Workflow

1. **Capture** — Accept the user’s brief even if it is one line; note gaps.
2. **Clarify** — Output medium (icon, social, slide, mockup), rough dimensions or aspect ratio, brand colors if any, and must-have vs nice-to-have (ask only when blocking).
3. **Rewrite** — Produce the **full** prompt using the layering order above (this is the “good practices” step).
4. **Generate** — Call **GenerateImage** with the rewritten description. Prefer saving to **`assets/`** with a descriptive filename (e.g. `assets/hero-spring-campaign.png`).
5. **Iterate** — If close: issue a **delta** prompt; if wrong: adjust the **layer** that failed (camera, lighting, style) before scrapping everything.
6. **Report** — Return file path(s), the **final** prompt (or summary), and optional next iterations.

## Prompting patterns (copy and adapt)

Square brackets `[like-this]` mark placeholders to fill in. Double quotes `"..."` mark exact text the model should render in the image.

**App icon (square, legible at small size)**

```text
Square app icon, centered symbol of [subject], flat vector style with subtle depth, limited palette [colors], 10% safe margin from edges, no tiny text, crisp edges, high contrast on [background tone].
```

**UI mockup still (marketing)**

```text
Photorealistic product screenshot of a [mobile/web] app, [screen name] view, centered device, soft studio lighting, neutral background, clean sans UI. Render the following text exactly: headline "[headline text]", button label "[CTA text]". Modern SaaS aesthetic.
```

**Illustration (not photo)**

```text
Editorial illustration of [subject], [mood], limited palette [colors], visible brush texture or clean vector shapes (pick one), generous whitespace, no photorealistic faces unless requested.
```

**Diagram / concept**

```text
Isometric diagram of [system], simple shapes, light grid, high contrast lines, no clutter, presentation slide style. Label the zones exactly: "[zone A label]", "[zone B label]".
```

## Examples: weak vs stronger

| Weak | Stronger |
|------|----------|
| `"A nice logo for my app"` | `Minimal wordmark for a productivity app, lowercase sans-serif feel, single accent color #2563EB on white, generous letter-spacing, no icon, horizontal logo lockup.` |
| `"Cyberpunk city"` | `Wide 16:9 cinematic shot of a rainy cyberpunk street at night, neon reflections on wet asphalt, single vanishing point, shallow depth of field, no readable text, teal and magenta accents.` |
| `"Fix the image"` | `Keep the same subject and composition; change only the background to soft gradient from #0f172a to #1e293b; leave lighting on the subject unchanged.` |

## References

- [Google — Prompt tips (Nano Banana Pro)](https://blog.google/products/gemini/prompting-tips-nano-banana-pro)
- [Google Cloud — Ultimate prompting guide (Nano Banana)](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- [DeepMind — Gemini image prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/)
