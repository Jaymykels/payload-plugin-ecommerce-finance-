# Changesets

This directory holds pending changesets — small markdown files describing changes that will be rolled into the next release.

## Adding a changeset

```bash
pnpm changeset
```

Pick the bump type (patch / minor / major) and write a one-line summary. Commit the generated file alongside your PR.

## Release flow

1. PR is merged into `main`.
2. The **Release** workflow opens (or updates) a "Version Packages" PR that consumes all pending changesets, bumps the version in `package.json`, and updates `CHANGELOG.md`.
3. Merging that PR triggers the same workflow to publish to npm.

No manual `npm version` or `npm publish` — everything flows through this pipeline.
