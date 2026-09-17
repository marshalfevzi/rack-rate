# Legacy pipeline fixture (frozen by stage 1.4b, 2026-09-14)

`legacy-derived.json` and `legacy-derived.csv` are the **unmodified** output of the legacy Python pipeline, copied before Stage 1.5 deleted it. They are the regression oracle for the TypeScript port: the ported `compute` must reproduce these numbers. `legacy-inputs.models.json` and `legacy-inputs.plans.json` are the pinned parity inputs for the TypeScript port. They are exact blobs from revision `97b99cadacf510c5970807ed80ffd05f349fa35c` (the Stage-1 revision whose additive data migration still preserves the legacy pipeline's inputs). They remain frozen rather than symlinked to `data/` so a future live fetch cannot move the parity oracle underneath the regression assertion.


Produced by, from the repository root, with the inputs at these hashes:

    python3 scripts/validate.py && python3 scripts/compute.py

**All seven hashes below describe the freeze-point revision `37119ad`, not the current working tree.** Read them that way. Five of the seven files no longer exist at those contents, by design:

- `scripts/validate.py`, `scripts/compute.py`, `data/derived.json` and `data/derived.csv` were deleted by the Stage 1.5 cutover.
- `data/models.json` and `data/plans.json` were migrated additively by Stage 1.4 (new fields on every row), so their working-tree hashes differ from the ones below. The legacy pipeline ran against the revisions listed here; the migration only added fields it does not read.
- `data/sources.json` matched its listed hash until Stage 1's final commit, which retargeted two present-tense references to the deleted fetcher inside `notes`. No number or citation changed.

Recover the frozen inputs with `git show 37119ad:data/models.json | shasum -a 256` (and likewise for each path). A mismatch against the working tree is expected and is not a fixture defect.

| File | sha256 |
|---|---|
| data/models.json | afd43741f4da56327946519c682c9dee4a344d7f015bc112d8f91f756ce8080c |
| data/plans.json | 2c6988df31809174015ba8a62b25d28eb65fd5dcb7fe2958d56fc5c81ed6995a |
| data/sources.json | 41cffc593329a3bae27d62fc40ee0d5c122f23ea60520f6d155050f5774acd60 |
| scripts/validate.py | 830ff6eda78e0386aae3d212455b5f179becd6a0b872d5a3f51bd2f87e92654e |
| scripts/compute.py | 56b996b801ebe27bde474d92f91cfbf8d7a08d5c10480c437b5dd62993dee8e4 |
| **data/derived.json** | **803cef427a6af2f32ade594518b1806a49bb21fea90cc80fc52684f10bab9ded** |
| **data/derived.csv** | **6759e509df222e07771b25086a22061d5f701da2da84793fa1ea5af3da98df34** |

Frozen counts: 178 pairs, 28 best routes, 5 known gaps, cross-check median 1.601 / min 1.006 / max 6.713 over 11 pairs.

Invariants this fixture pins (a port that drifts from any of them is wrong):

1. citation enforcement — a plan `evidence` id that does not resolve to `data/sources.json` fails validation;
2. the `quota_model` union `budget | credits | requests | tokens_total`, with `model_scope` gating so a Claude plan can never price a Kimi model;
3. `days_for_full_run` capped by the rolling window (5 h), not only the monthly quota;
4. `known_gaps` carried through as a backlog, not dropped.

The JSON is data, not prose: the port compares `pairs` (178), `best_routes` (28), `cross_check.pairs` (11) and `cross_check.summary.{median_ratio,min_ratio,max_ratio,pair_count}`.
