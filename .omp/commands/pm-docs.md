---
description: Keep project-management product and architecture documentation accurate.
---

Goal: Update the PM-owned project documents from current evidence while preserving existing content and validating their required structure.

Load `skill://project-management` for the PRD and architecture schemas. When the request concerns `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, or a UI surface brief, also load `skill://impeccable` and follow its document workflow; do not invent or duplicate its direction schema.

1. Call `pm_plan_sync` with `{ write: false }` to understand the current project state. Read `docs/pm/config.yml`, `docs/pm/plan.yml`, `PRD.md`, and `ARCHITECTURE.md`, plus the relevant existing product/design documents. Keep generated `docs/pm/plan.yml` read-only.

2. For `PRD.md`, update or create the document from `skill://project-management/templates/prd.md`, retaining existing requirements and adding evidence-based overview, feature requirements, non-functional requirements, technical specifications, and analytics. For `ARCHITECTURE.md`, update or create it from `skill://project-management/templates/architecture.md`, retaining existing decisions and documenting the module graph, boundaries, subsystems, data flow, and operations. Never overwrite an existing document: merge additions into it and report conflicts. Route `PRODUCT.md` and `DESIGN.md` work through `skill://impeccable`, including its design JSON and `**/.impeccable/surfaces/*.md` requirements.

3. Call `pm_doc_check` after editing. Repair every reported PM-doc error in the source documents, rerun `pm_doc_check`, and keep warnings visible. Then call `pm_plan_sync` with `{ write: true }` as the final operation so `docs/pm/plan.yml` reflects the validated records.

4. Report each document path changed or created, every merge decision, the final `pm_doc_check` result, the regenerated plan path, and all plan-sync issues.
