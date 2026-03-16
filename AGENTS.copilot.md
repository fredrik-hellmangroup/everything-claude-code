# GitHub Copilot Supplement

Use this supplement when ECC is installed for GitHub Copilot.

## Local Copilot Install Surface

- ECC installs local Copilot guidance under `$HOME/.copilot`.
- `copilot-instructions.md` is the primary GitHub Copilot CLI file that is auto-discovered from the home directory.
- `AGENTS.md` is merged with this supplement during Copilot installation so ECC can preserve the shared root guidance while adding Copilot-specific notes.
- `skills/everything-copilot-code/INSTRUCTION.md` is an ECC-owned reference artifact generated from the repository skill source and mirrored into `copilot-instructions.md`.

## GitHub Copilot Model Recommendations

| Task Type | Recommended Copilot Model |
|-----------|---------------------------|
| Routine coding, tests, formatting | GPT-5.4 |
| Complex features and architecture | GPT-5.4 |
| Fast iteration and low-cost drafts | GPT-5 mini |
| Tool-heavy coding flows | GPT-5.3-Codex |

## Copilot-Specific Notes

- GitHub Copilot uses **instructions** rather than Claude-style rules, so prefer concise natural-language guidance over rule-pack framing.
- Local Copilot installs should not copy Claude/Cursor/Codex directory trees into `$HOME/.copilot`; generate only the files Copilot can use directly.
- If users want Copilot to also read the generated local `AGENTS.md`, they can point `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` at `$HOME/.copilot`.
- Keep shared harness guidance in the root `AGENTS.md` and put Copilot-only deltas here instead of forking the shared file.
