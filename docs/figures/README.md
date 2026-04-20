# DevSync Figures

Mermaid source files:

- `devsync-system-architecture.mmd`
- `role-based-room-workflow.mmd`

## Generate directly in ChatGPT (no CLI)

Use the prompts in:

- `docs/figures/chatgpt-image-prompts.md`

How:

1. Open ChatGPT (model with image generation).
2. Paste one prompt from `chatgpt-image-prompts.md`.
3. Ask for output as `PNG` (or `SVG-style vector look`) and 16:9.
4. Download the generated image.

Tip: If text looks blurry, ask ChatGPT: `Regenerate with sharper text, larger labels, and high contrast.`

## Quick export (PNG/SVG)

If Mermaid CLI is available:

```bash
npx @mermaid-js/mermaid-cli -i docs/figures/devsync-system-architecture.mmd -o docs/figures/devsync-system-architecture.png
npx @mermaid-js/mermaid-cli -i docs/figures/devsync-system-architecture.mmd -o docs/figures/devsync-system-architecture.svg
npx @mermaid-js/mermaid-cli -i docs/figures/role-based-room-workflow.mmd -o docs/figures/role-based-room-workflow.png
npx @mermaid-js/mermaid-cli -i docs/figures/role-based-room-workflow.mmd -o docs/figures/role-based-room-workflow.svg
```

Or paste each `.mmd` file into https://mermaid.live and export.
