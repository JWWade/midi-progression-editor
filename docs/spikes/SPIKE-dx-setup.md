# SPIKE — DX Setup: Prerequisite Checks and `generate:api` Hardening

**Date:** 2026-03-30
**Author:** @copilot
**Related issue:** ISSUE-E9-09 — Developer Experience (DX) Audit
**Status:** Open

---

## Summary

This SPIKE explores two setup/tooling gaps identified in the DX audit:

1. [Prerequisite validation before first-run](#1-prerequisite-validation)
2. [`generate:api` script hardening](#2-generate-api-script-hardening)

Each section documents the problem, evaluates options, and provides a recommended approach
with implementation sketches.

---

## 1. Prerequisite Validation

### Problem

New contributors who run `./run-dev.sh` (or `run-dev.bat`) on a machine that does not meet
the prerequisites receive a cryptic failure message deep inside the script rather than an
upfront, actionable diagnosis. The most common failures are:

| Missing prerequisite | Observed failure message |
|---|---|
| `node` not installed | `sh: npm: command not found` |
| Node < 18 | `npm warn EBADENGINE` followed by build errors |
| `dotnet` not installed | `sh: dotnet: command not found` |
| .NET SDK < 10 | `error MSB4019: The imported project ... was not found` |

None of these messages clearly instruct the developer on how to fix the issue.

### Options

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A — Inline guards in `run-dev.sh`** | Add version checks at the top of the launcher | Zero new files; immediate feedback | Duplicated if more launchers are added; harder to test |
| **B — Shared `scripts/check-env.sh`** | Separate shell script sourced by launchers | Reusable; testable; single source of truth | Requires a second file; Windows needs a `.bat` or `.ps1` equivalent |
| **C — Node.js `scripts/check-env.js`** | Run `node scripts/check-env.js` as a pre-dev hook | Cross-platform; testable with Jest/Vitest; no bash dependency | Requires Node to already be installed (bootstrapping problem for Node-check) |
| **D — `package.json` `predev` hook** | `"predev": "node scripts/check-env.js"` | Auto-runs before `npm run dev` | Only helps when entering via `npm run dev`; doesn't help with `run-dev.sh` directly |

### Recommendation

Combine **Options A + B**:

1. Create `scripts/check-env.sh` with version checks.
2. Source it from `run-dev.sh`.
3. Create an equivalent `scripts/check-env.bat` for Windows.

This gives the cleanest separation of concerns while remaining accessible from both launchers.

### Implementation Sketch — `scripts/check-env.sh`

```bash
#!/usr/bin/env bash
# scripts/check-env.sh — Verify prerequisites for MIDI Progression Editor
# Source this from run-dev.sh: source "$(dirname "$0")/scripts/check-env.sh"

set -euo pipefail

MIN_NODE_MAJOR=18
MIN_DOTNET_MAJOR=10

check_command() {
  local cmd="$1"
  local install_url="$2"
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌  '$cmd' is not installed or not on PATH."
    echo "    Install: $install_url"
    exit 1
  fi
}

check_node_version() {
  local raw
  raw=$(node --version 2>/dev/null | sed 's/v//')
  local major
  major=$(echo "$raw" | cut -d. -f1)
  if [ "$major" -lt "$MIN_NODE_MAJOR" ]; then
    echo "❌  Node.js $major detected — version $MIN_NODE_MAJOR or higher is required."
    echo "    Install: https://nodejs.org"
    exit 1
  fi
  echo "✅  Node.js v$raw"
}

check_dotnet_version() {
  local raw
  raw=$(dotnet --version 2>/dev/null)
  local major
  major=$(echo "$raw" | cut -d. -f1)
  if [ "$major" -lt "$MIN_DOTNET_MAJOR" ]; then
    echo "❌  .NET $major detected — version $MIN_DOTNET_MAJOR or higher is required."
    echo "    Install: https://dotnet.microsoft.com/en-us/download/dotnet"
    exit 1
  fi
  echo "✅  .NET $raw"
}

echo "Checking prerequisites..."
check_command "node" "https://nodejs.org"
check_command "dotnet" "https://dotnet.microsoft.com/en-us/download/dotnet"
check_node_version
check_dotnet_version
echo ""
```

### Implementation Sketch — `scripts/check-env.bat`

```bat
@echo off
REM scripts/check-env.bat — Verify prerequisites for MIDI Progression Editor

SET MIN_NODE_MAJOR=18
SET MIN_DOTNET_MAJOR=10

node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo ^❌  'node' is not installed. Install: https://nodejs.org
  exit /b 1
)

FOR /F "tokens=1 delims=." %%V IN ('node --version') DO (
  SET NODE_VER=%%V
)
REM Strip leading 'v'
SET NODE_VER=%NODE_VER:~1%
IF %NODE_VER% LSS %MIN_NODE_MAJOR% (
  echo ^❌  Node.js %NODE_VER% detected — version %MIN_NODE_MAJOR%+ required.
  exit /b 1
)

dotnet --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo ^❌  'dotnet' is not installed. Install: https://dotnet.microsoft.com/en-us/download/dotnet
  exit /b 1
)

echo ^✅  Prerequisites verified.
```

### Open Questions

1. Should the check be silent on success (only print on failure) to keep the launcher banner
   clean?
2. Should the scripts detect `npm` separately from `node`, or is co-location assumed?
3. Is a Windows PowerShell variant (`check-env.ps1`) worth adding alongside the `.bat`?

---

## 2. `generate:api` Script Hardening

### Problem

`npm run generate:api` has two failure modes that are not caught gracefully:

| Scenario | Current behaviour | Desired behaviour |
|---|---|---|
| Backend is offline | `openapi-typescript` exits with error; final `echo` still runs or doesn't run | Clear message: "Backend must be running on port 5110" |
| Backend returns partial spec | `openapi-typescript` exits 0; output file may be an empty or truncated schema | Detect and abort before overwriting existing `generated/index.ts` |

### Options

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A — Inline file-size check** | Chain a `node -e "..."` after the generator to assert the output file is non-trivially sized | Minimal; no new files | Fragile heuristic (size threshold is arbitrary) |
| **B — `scripts/generate-api.js`** | Extract the whole generation step into a Node.js script with explicit checks | Readable; testable; can verify JSON schema validity | One more file to maintain |
| **C — `pre` npm script hook** | Add `"pregenerate:api": "curl -s http://localhost:5110/health || (echo Backend not running && exit 1)"` | Easy; standard npm lifecycle | `curl` may not be available on Windows; requires backend to expose `/health` |
| **D — Status quo** | Accept current behaviour; document the requirement to have the backend running | Zero effort | Poor DX; can corrupt working types |

### Recommendation

**Option C** in the short term (already satisfied — `GET /Health` exists), combined with
**Option B** as a follow-on improvement.

Add a `pregenerate:api` script that verifies the backend health endpoint before invoking
`openapi-typescript`. This provides a clear, actionable failure message with zero new files:

```json
"pregenerate:api": "node -e \"require('http').get('http://localhost:5110/health', r => { if (r.statusCode !== 200) { console.error('Backend health check failed — is the backend running on port 5110?'); process.exit(1); } }).on('error', () => { console.error('Cannot reach backend on port 5110 — start the backend with: cd server/ParametricMusic.Api && dotnet run'); process.exit(1); });\"",
"generate:api": "echo 'Generating types and client from OpenAPI spec...' && openapi-typescript http://localhost:5110/swagger/v1/swagger.json --output src/api/generated/index.ts && echo 'API client generated successfully'"
```

### Implementation Sketch — `scripts/generate-api.js`

```js
// scripts/generate-api.js
// Usage: node scripts/generate-api.js
import http from 'http';
import { execSync } from 'child_process';
import { statSync } from 'fs';

const HEALTH_URL = 'http://localhost:5110/health';
const SPEC_URL   = 'http://localhost:5110/swagger/v1/swagger.json';
const OUTPUT     = 'src/api/generated/index.ts';
const MIN_BYTES  = 500;

function checkHealth() {
  return new Promise((resolve, reject) => {
    http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) resolve();
      else reject(new Error(`Health endpoint returned ${res.statusCode}`));
    }).on('error', () => reject(
      new Error('Cannot reach backend — start it with: cd server/ParametricMusic.Api && dotnet run')
    ));
  });
}

try {
  await checkHealth();
  console.log('✅  Backend is healthy — generating API client...');

  execSync(`npx openapi-typescript ${SPEC_URL} --output ${OUTPUT}`, { stdio: 'inherit' });

  const { size } = statSync(OUTPUT);
  if (size < MIN_BYTES) {
    throw new Error(`Generated file is suspiciously small (${size} bytes) — generation may have failed.`);
  }

  console.log(`✅  API client generated (${size} bytes) → ${OUTPUT}`);
} catch (err) {
  console.error(`\n❌  API generation failed: ${err.message}\n`);
  process.exit(1);
}
```

### Open Questions

1. Should `generate:api` create a backup of the existing `generated/index.ts` before
   overwriting, to allow a quick rollback if the generated output is invalid?
2. Should the output file size threshold (`MIN_BYTES`) be configurable, or is a static
   constant sufficient?
3. Is it worth adding an `npm run generate:api:check` dry-run mode that validates the spec
   without writing the file?
