// The site's one reader of committed data. Nothing else under apps/site imports
// data/*.json. Task 3.5 extends this module with the derived-document views
// (composites, frontiers, badges, token allowances); task 3.4 seeded it with
// the identity rows its routes need.
//
// Parsed, not cast: the committed files are a trust boundary even though the
// data CLI validated them, so a shape change fails the build, not a page.
import { ModelsFile, PlansFile } from "@rack-rate/core"

import modelsDocument from "../../../../data/models.json"
import plansDocument from "../../../../data/plans.json"

// One row per model. `Model.id` is the slug for /models/[slug]: it is already
// a stable kebab-case key, so no separate slug mapping exists to drift.
export const models = ModelsFile.parse(modelsDocument).models

// One row per plan. `Plan.id` is the slug for /plans/[slug]. Every committed
// plan gets a page, including the ones whose quota is still unresolved.
export const plans = PlansFile.parse(plansDocument).plans
