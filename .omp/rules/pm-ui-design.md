---
description: Design-contract and impeccable craft requirements for UI task implementation.
agents: [pm-ui-implementer, main]
---

# PM UI design constraints

- Before editing UI, read the repository's `DESIGN.md` and the matching surface brief under `**/.impeccable/surfaces/*.md`. Use the brief for the actual surface being changed; do not substitute a generic or unrelated brief.
- Load `skill://impeccable` and run its detector and craft floor for the changed UI. Treat the resulting findings as implementation input and report the evidence.
- Preserve the project's existing design tokens, semantic structure, responsive behavior, keyboard accessibility, and reduced-motion behavior. Verify the actual surface when it can run.
- Never copy a direction contract into shipped source. Direction contracts guide implementation; they are not product copy, comments, configuration, or runtime data.
