# CI/CD Pipeline

Overview of all GitHub Actions workflows that run automatically on push, pull-request, and schedule events.

```mermaid
flowchart TD
    Push["git push / PR opened"]

    subgraph CI["ci.yml — CI (push + PR to develop/main)"]
        Frontend["Frontend job\nlint → test → build"]
        Backend["Backend job\nrestore → build → test"]
    end

    subgraph Security["security.yml — Security Scan (push + PR + weekly Mon 08:00)"]
        NpmAudit["npm audit\n(fail on high/critical)"]
        DotnetVuln["dotnet list --vulnerable\n(transitive deps)"]
        CodeQL["CodeQL analysis\n(JS/TS + C#)"]
    end

    subgraph DocsCheck["docs-check.yml — Documentation Check (PR to develop/main)"]
        DriftCheck["Docs drift detection\n(source changed → docs must change\nor checkbox ticked)"]
        BrokenLinks["Broken link check\n(lychee · weekly Mon 09:00)"]
    end

    subgraph DocsGenerate["docs-generate.yml — Generate Docs (push to main)"]
        TypeDoc["TypeDoc\n(TypeScript API docs → artifact)"]
        CSharpXML["C# XML docs\n(dotnet build /p:GenerateDocumentationFile=true → artifact)"]
    end

    Push --> CI
    Push --> Security
    Push --> DocsCheck
    Push --> DocsGenerate
```

## Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to `develop`, `main` | Lint, test, and build frontend and backend |
| `security.yml` | Push/PR to `develop`, `main`; weekly Mon 08:00 | Dependency vulnerability audit, CodeQL SAST |
| `docs-check.yml` | PR to `develop`, `main`; weekly Mon 09:00 (links only) | Detect docs drift; check for broken links |
| `docs-generate.yml` | Push to `main`; manual | Generate TypeDoc API docs and C# XML docs as build artifacts |
| `delete-merged-branches.yml` | PR close, push to `main` | Housekeeping: delete merged remote branches |

## Required Checks for Merge

Branch protection on `develop` and `main` should require:

- `Frontend (lint, test, build)` — from `ci.yml`
- `Backend (build, test)` — from `ci.yml`
- `Detect documentation drift` — from `docs-check.yml`
