Use **Zuko** (the visual specialist agent) with the **cursor-image-generation** skill for this task.

1. **Read** the **cursor-image-generation** skill (`skills/cursor-image-generation/SKILL.md`) and follow its workflow: **expand a rough user brief into a full prompt** before calling **GenerateImage** (layered prompts, iteration).
2. **Clarify** only what is blocking (asset type, aspect ratio, brand colors, reference image) if the user’s message is too vague to rewrite safely.
3. **Rewrite** the ask into a strong prompt per the skill, then **generate** with the **GenerateImage** tool; save under **`assets/`** (or the path the user requested) with descriptive filenames.
4. **Iterate** with targeted edits per the skill — do not re-roll the full prompt unless the direction is wrong.
5. **Return** paths to saved files, the **final** prompt (or a clear summary), and optional next iterations.

If the task is **implementation** of a Figma file or **code** for UI, also use Zuko’s **implementing-figma-designs** or **web-design-guidelines** as appropriate.
