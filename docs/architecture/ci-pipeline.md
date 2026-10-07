# CI/CD Pipeline

Overview of all GitHub Actions workflows that run automatically on push, pull-request, and schedule events.

```mermaid
flowchart TD
    Push["git push / PR opened"]

    subgraph CI["ci.yml — CI (push + PR to develop/main)"]
        Frontend["Frontend job\nlint → test → build"]
    end

    subgraph Security["security.yml — Security Scan (push + PR + weekly Mon 08:00)"]
        NpmAudit["npm audit\n(fail on high/critical)"]
        CodeQL["CodeQL analysis\n(JavaScript/TypeScript)"]
    end

    subgraph DocsCheck["docs-check.yml — Documentation Check (PR to develop/main)"]
        DriftCheck["Docs drift detection\n(source changed → docs must change\nor checkbox ticked)"]
        BrokenLinks["Broken link check\n(lychee · weekly Mon 09:00)"]
    end

    subgraph DocsGenerate["docs-generate.yml — Generate Docs (push to main)"]
        TypeDoc["TypeDoc\n(TypeScript API docs → artifact)"]
    end

    Push --> CI
    Push --> Security
    Push --> DocsCheck
    Push --> DocsGenerate
```

## Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to `develop`, `main` | Lint, test, and build the frontend |
| `security.yml` | Push/PR to `develop`, `main`; weekly Mon 08:00 | npm dependency audit and JavaScript/TypeScript CodeQL SAST |
| `docs-check.yml` | PR to `develop`, `main`; weekly Mon 09:00 (links only) | Detect docs drift; check for broken links |
| `docs-generate.yml` | Push to `main`; manual | Generate TypeDoc documentation as a build artifact |
| `delete-merged-branches.yml` | PR close, push to `main` | Housekeeping: delete merged remote branches |

## Required Checks for Merge

Branch protection on `develop` and `main` should require:

- `Frontend (lint, test, build)` — from `ci.yml`
- `Detect documentation drift` — from `docs-check.yml`
