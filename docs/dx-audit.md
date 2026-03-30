# Developer Experience (DX) Audit — Parametric MIDI Sequencer

**Audit date:** 2026-03-30
**Auditor:** Copilot (automated audit via ISSUE-E9-09)
**Scope:** Full repository — setup, tooling, scripts, folder structure, error handling, and
API evolution workflow.

---

## 1. Executive Summary

The Parametric MIDI Sequencer offers a strong baseline developer experience: clear
prerequisites, automated launchers for both platforms, strict TypeScript, xUnit tests, and
an OpenAPI-driven type-generation pipeline. Day-to-day workflows are fast once the environment
is established.

This audit identified **zero blockers**, **four high-priority friction points**, and **seven
medium/low-priority improvements**. All items are catalogued below with recommended actions
and current status.

| Severity | Count | Status |
|---|---|---|
| 🔴 High | 4 | Items DX-01 – DX-04 — addressed in ISSUE-E9-09 |
| 🟡 Medium | 5 | Items DX-05 – DX-09 — open / follow-on |
| 🟢 Low | 2 | Items DX-10 – DX-11 — minor cosmetic / hygiene |

---

## 2. Audit Methodology

Friction points were identified by walking through every developer workflow from a clean
clone:

1. Prerequisite verification
2. One-command launch (`run-dev.sh` / `run-dev.bat`)
3. Manual multi-terminal setup
4. First-run `.env` configuration
5. Frontend lint, test, build cycle
6. Backend dotnet test cycle
7. API client type regeneration (`npm run generate:api`)
8. Adding a new feature (backend endpoint → regenerate → use in frontend)
9. Pull-request readiness checks
10. Documentation and discoverability review

---

## 3. Friction Inventory

### 3.1 Setup & Onboarding

#### DX-01 — `run-dev.sh` does not check prerequisites or install dependencies 🔴 High

**Observed behaviour:** Running `./run-dev.sh` on a machine that has not previously run
`npm install` fails mid-script with a cryptic Vite error (`sh: vite: command not found`),
even though the backend may already be serving correctly. There is no guard that checks for
`node_modules/`, nor is `dotnet restore` called if packages are missing.

**Impact:** New contributors encounter an opaque failure on the very first command they run.
The error message does not mention `npm install` or `dotnet restore`.

**Recommendation:** Add pre-flight checks:

```bash
# In run-dev.sh, before starting servers
if [ ! -d "$ROOT/client/node_modules" ]; then
  echo "Installing frontend dependencies (first-time only)..."
  (cd "$ROOT/client" && npm install)
fi
```

A similar guard for `dotnet restore` is warranted (see DX-02).

**Status:** Addressed — `run-dev.sh` now installs frontend dependencies and restores backend
packages when the node_modules directory or the dotnet restore sentinel is absent.

---

#### DX-02 — `run-dev.bat` kills **all** `dotnet.exe` processes system-wide 🔴 High

**Observed behaviour:** The Windows launcher script contains:

```bat
taskkill /F /IM dotnet.exe >nul 2>&1
```

This terminates every `dotnet` process on the machine — including unrelated ASP.NET Core
applications, Entity Framework CLI tools, and SDK tooling — rather than freeing only port
5110.

**Impact:** Developers running other .NET projects in the same environment lose those
processes without warning. This is especially destructive in continuous-development
sessions.

**Recommendation:** Replace the broad kill with a targeted port-based approach:

```bat
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5110') DO (
  taskkill /F /PID %%P >nul 2>&1
)
```

**Status:** Addressed — `run-dev.bat` now uses a targeted kill by port rather than a
process-name–based kill.

---

#### DX-03 — `run-dev.sh` does not free the frontend port (5173) 🔴 High

**Observed behaviour:** `run-dev.sh` frees port 5110 (backend) if occupied, but does nothing
for port 5173 (frontend). A stale Vite process from a previous session will cause the new
frontend to either fail or bind to a randomly incremented port, silently serving on a
different URL from the one displayed in the launcher banner.

**Impact:** After a crash or force-quit, the frontend may start silently on port 5174 or
higher while the banner continues to advertise 5173, sending developers to a blank page.

**Recommendation:** Add a symmetric port-free step for 5173:

```bash
if lsof -ti:5173 >/dev/null 2>&1; then
  echo "[0/2] Freeing port 5173..."
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
```

**Status:** Addressed — `run-dev.sh` now frees both ports before starting services.

---

#### DX-04 — `.env.local` copy step is absent from the Quick Start section of `README.md` 🔴 High

**Observed behaviour:** `CONTRIBUTING.md` correctly instructs contributors to run
`cp .env.example .env.local`, but `README.md` (the first file most people read) omits this
step entirely. New contributors who follow only the README manual setup may never create
`.env.local`, so `VITE_API_BASE_URL` is undefined at runtime.

**Impact:** The frontend falls back gracefully to `http://localhost:5110` via the in-code
default, so the app still works — but the missing step creates confusion when contributors
try to change the backend URL later and cannot understand why their `.env.local` value is
ignored.

**Recommendation:** Add the copy step to the Option 3 (manual) section of `README.md`:

```bash
cd client
cp .env.example .env.local   # only needed once; edit if backend runs elsewhere
npm install
npm run dev
```

**Status:** Addressed — `README.md` manual-setup section now includes the `.env.local` copy
step.

---

### 3.2 Scripts

#### DX-05 — `generate:api` fails silently when the backend is not running 🟡 Medium

**Observed behaviour:** Running `npm run generate:api` when the backend is offline prints a
connection-refused error from `openapi-typescript`, but the exit message echoes
`'API client generated successfully'` because the echo command runs unconditionally after
the generator tool, regardless of exit code.

**Root cause:** The script chain uses `&&` between the first `echo` and the generator, but
not between the generator and the final success `echo`:

```json
"generate:api": "echo 'Generating...' && openapi-typescript ... && echo 'API client generated successfully'"
```

The `&&` before the final echo is actually present in the current script — the real issue is
that `openapi-typescript` exits with code 0 even when it cannot reach the server (it writes
a partial or empty output file). This can overwrite a working `generated/index.ts` with an
empty or stub file.

**Impact:** A developer may unknowingly destroy their working generated types and not notice
until the TypeScript compiler fails on the next build.

**Recommendation:** Validate the generated file is non-empty as a post-generation check:

```json
"generate:api": "openapi-typescript http://localhost:5110/swagger/v1/swagger.json --output src/api/generated/index.ts && node -e \"const fs=require('fs');const s=fs.statSync('src/api/generated/index.ts');if(s.size<100)throw new Error('Generated file appears empty — is the backend running?');\" && echo 'API client generated successfully'"
```

A cleaner approach is to extract this into a small `scripts/generate-api.js` helper.

**Status:** Open — tracked as a follow-on improvement.

---

#### DX-06 — No script to verify the development environment prerequisites 🟡 Medium

**Observed behaviour:** There is no `check:env` or similar script that verifies the required
tool versions are present (`node`, `dotnet`, `npm`) before running other scripts. First-time
contributors must manually run `node --version` and `dotnet --version`.

**Impact:** Low friction on its own, but compounds with DX-01 — a missing prerequisite
causes a confusing failure inside a launcher script rather than a clear "missing dependency"
message.

**Recommendation:** Add a lightweight `scripts/check-env.sh` (sourced in `run-dev.sh`) that
checks versions and exits early with an actionable message. See `docs/spikes/SPIKE-dx-setup.md`
for a design sketch.

**Status:** Open — SPIKE created.

---

#### DX-07 — `test:coverage` script exists but is not run in CI 🟡 Medium

**Observed behaviour:** `package.json` exposes a `test:coverage` script backed by
`vitest run --coverage`, but the CI workflow (`ci.yml`) runs `npm test` (the plain
`vitest run` script) and does not produce a coverage report or enforce a coverage
threshold.

**Impact:** Coverage silently regresses without any CI signal. The threshold is undefined,
so the team has no agreed floor.

**Recommendation:** Either add a CI step that runs `npm run test:coverage` and archives the
report as a workflow artifact, or accept the current state and document it as a known gap.
If a threshold is desired, configure it in `vitest.config.ts`:

```ts
coverage: { thresholds: { lines: 70, functions: 70 } }
```

**Status:** Open — noted for future CI improvement sprint.

---

### 3.3 Project Structure & Discoverability

#### DX-08 — No `docs/README.md` index for the documentation folder 🟡 Medium

**Observed behaviour:** The `docs/` directory contains 10+ audit documents, a `spikes/`
subdirectory with 8 files, and no index or table of contents. Navigating to
`docs/` on GitHub renders a plain file listing, making it difficult to understand which
document to read for a given question.

**Impact:** Contributors waste time scanning filenames. The relationship between audits, spikes,
and action items is not visible.

**Recommendation:** Create `docs/README.md` as a lightweight navigation document with a
categorised table of all docs files. This file already exists as a stub — it should be
expanded.

**Status:** Addressed — `docs/README.md` updated with a categorised docs index.

---

#### DX-09 — `docs/spikes/security-audit.md` is misplaced 🟡 Medium

**Observed behaviour:** `docs/spikes/security-audit.md` is a security audit report, not an
exploratory spike. All other files in `docs/spikes/` follow the `SPIKE-*` naming convention
and contain open research questions. This file is a completed audit report that belongs in
`docs/` alongside the other audits.

**Impact:** The document is hard to find when searching for security information; the spikes
folder feels inconsistent.

**Recommendation:** Move `docs/spikes/security-audit.md` to `docs/security-audit.md` and
update any cross-references. This was noted in the documentation audit (ISSUE-E9-08) and
not yet acted on.

**Status:** Open — no consumers currently link to the file by path; move is safe when convenient.

---

### 3.4 Error Handling & API Evolution

#### DX-10 — Backend returns HTTP 500 for invalid enum values without a descriptive message 🟢 Low

**Observed behaviour:** Sending a `POST /Chord/from-root` request with an unrecognised
`chordQuality` string (e.g. `"sus4"`) causes the JSON deserializer to throw, and the
`AddProblemDetails()` middleware returns a 400 or 500 Problem response whose `detail` field
contains an internal `JsonException` message with a stack reference, rather than an
actionable developer message.

**Impact:** External API consumers (and the frontend when the generated types drift) receive
confusing error text. The Swagger UI also does not validate enum values client-side.

**Recommendation:** Add model-validation attributes or a `FluentValidation` pipeline to
return a consistent `400 Bad Request` with an `errors` payload listing valid enum values.
The existing `ChordQualityJsonConverter` handles the deserialization — extend it to produce
a `JsonException` with `"Valid values are: Major, Minor, Diminished, ..."`.

**Status:** Open — minor; backend already returns 400 for most invalid inputs.

---

#### DX-11 — API versioning is implicit (path prefix `v1`) with no formal versioning policy 🟢 Low

**Observed behaviour:** The Swagger document is registered as `"v1"` and the Swagger UI
endpoint is `/swagger/v1/swagger.json`. However, there is no formal API versioning strategy
(e.g. `Asp.Versioning`) and no documentation stating the versioning policy, deprecation
process, or compatibility guarantees.

**Impact:** Low friction today because the API is consumed solely by the co-located frontend
client. Risk increases if the API is ever exposed externally or if breaking changes are
introduced without bumping the version.

**Recommendation:** Document the current implicit versioning strategy in `server/README.md`
with a note that a formal versioning library (e.g. `Asp.Versioning.Mvc`) should be adopted
before any external API consumers are added. This is a pre-emptive hygiene item.

**Status:** Open — no action required now; captured for future reference.

---

## 4. Prioritised Action Plan

| ID | Area | Severity | Description | Status |
|---|---|---|---|---|
| DX-01 | Setup — Linux/macOS | 🔴 High | `run-dev.sh` does not install deps on first run | ✅ Addressed |
| DX-02 | Setup — Windows | 🔴 High | `run-dev.bat` kills all `dotnet.exe` processes | ✅ Addressed |
| DX-03 | Setup — Linux/macOS | 🔴 High | `run-dev.sh` does not free frontend port 5173 | ✅ Addressed |
| DX-04 | Onboarding / Docs | 🔴 High | `README.md` missing `.env.local` copy step | ✅ Addressed |
| DX-05 | Scripts | 🟡 Medium | `generate:api` may silently overwrite types when backend is offline | Open |
| DX-06 | Scripts | 🟡 Medium | No prerequisite-check script for first-time contributors | Open |
| DX-07 | CI / Testing | 🟡 Medium | `test:coverage` not enforced in CI pipeline | Open |
| DX-08 | Docs / Structure | 🟡 Medium | `docs/` has no README / navigation index | ✅ Addressed |
| DX-09 | Docs / Structure | 🟡 Medium | `security-audit.md` misplaced in `spikes/` | Open |
| DX-10 | Error Handling | 🟢 Low | Invalid enum values return non-descriptive backend errors | Open |
| DX-11 | API Evolution | 🟢 Low | No formal API versioning policy documented | Open |

---

## 5. Improvements Implemented in ISSUE-E9-09

### 5.1 `run-dev.sh` — first-run dependency install & port 5173 cleanup

The launcher script now performs two additional checks before starting servers:

1. **Frontend dependency install guard** — detects a missing `client/node_modules`
   directory and runs `npm install` automatically before starting Vite.
2. **Backend restore guard** — detects a missing `server/ParametricMusic.Api/obj`
   directory and runs `dotnet restore` automatically.
3. **Port 5173 cleanup** — frees the frontend port with the same `lsof`-based approach
   already used for port 5110.

### 5.2 `run-dev.bat` — targeted port-based process cleanup

The Windows launcher script was changed from a broad `taskkill /F /IM dotnet.exe` to a
targeted port-based kill that only terminates the process holding port 5110, leaving all
other `dotnet` processes untouched.

### 5.3 `README.md` — `.env.local` copy step added to manual setup

The Option 3 (Manual Setup) section of `README.md` now includes the
`cp .env.example .env.local` step with a note that it is only required once.

### 5.4 `docs/README.md` — documentation navigation index

A new `docs/README.md` provides a categorised table of all documents and spikes with
brief descriptions, giving new contributors a single entry point for all reference material.

---

## 6. SPIKE References

| SPIKE | Topic | Status |
|---|---|---|
| [`SPIKE-dx-setup.md`](spikes/SPIKE-dx-setup.md) | Prerequisite-check scripts and cross-platform `generate:api` hardening | Open |
