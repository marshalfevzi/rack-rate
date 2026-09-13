# Vendored anti-slop Oxlint plugin

Source: `install-anti-slop` skill bundle at
`/Users/marshal/.agents/skills/install-anti-slop/assets/anti-slop/` (bundle dated
2026-09-12), copied with
`node /Users/marshal/.agents/skills/install-anti-slop/scripts/install.mjs`.

Upstream repository and commit: **unknown**. The bundle carries no commit
identity; the only revision it records is the vendored ESLint Stylistic commit in
`vendor/eslint-stylistic/UPSTREAM.md`
(`435c3ea0fd26a5fef9042c4b36b6e165fbbf8d08`). Treat the bundle directory as the
recovery source for a future merge, not a package version.

Installed paths (relative to this directory):

- `index.ts` — generic entry point, registered as `anti-slop` in
  `.oxlintrc.json`.
- `rules/` — the 18 generic rules.
- `shared/` — shared rule helpers.
- `vendor/eslint-stylistic/` — vendored padding-line rule, its `LICENSE`, and
  `UPSTREAM.md`.

Intentional deviations from the bundle:

- `effect/` was deleted after copying; the repository has no `effect`
  dependency, and the Effect rule set is registered only when it does.
- `rules/*.test.ts` were not shipped in the bundle although
  `vendor/eslint-stylistic/UPSTREAM.md` refers to them. Rule behaviour here is
  verified by the `.oxlintrc.json` probe described in `PLAN.md` task 1.10's
  verification, not by ported tests.

Update procedure: read
`/Users/marshal/.agents/skills/install-anti-slop/references/update.md` and follow
it. Never re-run the installer over this directory; the deviations above are
owned policy and must survive a merge.
