---
trigger: glob
---

# GIT CONVENTIONS RULE (.agents/rules/git-conventions.md)

## 1. Conventional Commit Message Format

ALL commit messages MUST strictly follow the Conventional Commits specification:
`<type>(<scope>): <short imperative summary>`

### Allowed Types:

- `feat`: A new feature implementation matching PRD requirements (e.g., `feat(checkout): add rate-limited initiation endpoint`).
- `fix`: A bug fix or patch (e.g., `fix(webhook): enforce timing-safe signature comparison`).
- `chore`: Maintenance tasks, dependency updates, or Prisma migrations (e.g., `chore(prisma): update subscription status enum`).
- `test`: Adding or refactoring unit/proration test suites.
- `refactor`: Code changes that neither fix a bug nor add a feature.

### Allowed Scopes:

`schema`, `checkout`, `proration`, `webhook`, `billing`, `security`, `ui`, `upload`, `jobs`, `ai`, `evidence`

## 2. Branch Strategy

- Direct commits to `main` or `master` are STRICTLY FORBIDDEN.
- ALL work MUST be performed on feature or fix branches following the pattern:
  - `feature/<scope>-description` (e.g., `feature/proration-integer-engine`)
  - `fix/<scope>-description` (e.g., `fix/webhook-duplicate-event-handling`)

## 3. Pull Request Criteria

Before merging any PR into the main branch, the following automated checks MUST pass:

1. `npx prisma validate` returns 0 errors.
2. `npm run build` compiles with 0 TypeScript and 0 linting errors.
3. All unit tests for changed logic pass with 100% coverage (e.g., integer proration in `lib/proration.ts`, Zod parsing/summarization schemas).
