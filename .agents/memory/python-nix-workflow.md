---
name: Python backend on Nix — workflow config pitfalls
description: How to correctly run a Python/uvicorn server as a Replit workflow on NixOS.
---

## Rules

1. **Never use `pip install` in the workflow run command.** NixOS blocks pip with "externally-managed-environment". Use `installLanguagePackages({ language: "python", packages: [...] })` in CodeExecution — it calls uv correctly and installs to `.pythonlibs/`.

2. **Use the absolute path to uvicorn.** After installing via `installLanguagePackages`, uvicorn lands at `/home/runner/workspace/.pythonlibs/bin/uvicorn`. The workflow runner does NOT have `.pythonlibs/bin` on its PATH.

3. **The workflow runner CWD is NOT `/home/runner/workspace`.** `cd artifacts/api-server` fails. Use uvicorn's `--app-dir /home/runner/workspace/artifacts/api-server` flag to point at the app directory, or use absolute paths everywhere.

4. **Working run command:**
   ```
   /home/runner/workspace/.pythonlibs/bin/uvicorn main:app --app-dir /home/runner/workspace/artifacts/api-server --reload --host 0.0.0.0 --port 8080
   ```

**Why:** Learned through iterative failures — pip blocked by Nix, bash script not found (not executable in workflow context), `cd` failing because workflow CWD differs from workspace root, uvicorn not on workflow PATH.

**How to apply:** Any time a Python FastAPI/uvicorn server needs to be added as a workflow on this Replit project.
