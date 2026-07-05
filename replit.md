# File Insight

AI-powered document intelligence tool — upload PDFs, Excel sheets, and images, then see the content synthesized into an interactive mind map with key metrics and findings.

## Run & Operate

- `pnpm --filter @workspace/app run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, @xyflow/react (mind map), TailwindCSS, shadcn/ui
- API: Express 5 + multer (file uploads)
- DB: PostgreSQL + Drizzle ORM (analyses table)
- File parsing: pdf-parse (PDF), xlsx/SheetJS (Excel/CSV), base64 (images)
- AI: OpenAI-compatible API (Ollama, OpenAI, etc.) via `openai` npm package
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/app/` — React frontend (upload page, mind map view)
- `artifacts/api-server/src/routes/analyses/` — file upload + AI analysis route
- `artifacts/api-server/src/lib/ai.ts` — LLM client (OpenAI-compatible)
- `artifacts/api-server/src/lib/fileParser.ts` — PDF, Excel, image extraction
- `lib/db/src/schema/analyses.ts` — Drizzle analyses table schema
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)

## Environment Variables

- `AI_BASE_URL` — base URL for OpenAI-compatible API (e.g. your ngrok Ollama URL + `/v1`)
- `AI_MODEL` — model name (default: `llama3:8b`)
- `AI_API_KEY` — API key (default: `ollama` for local Ollama)
- `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Using with local Ollama (llama3:8b)

1. Start Ollama: `ollama run llama3:8b`
2. Expose via ngrok: `ngrok http 11434`
3. Set `AI_BASE_URL` to the ngrok HTTPS URL + `/v1` (e.g. `https://abc123.ngrok.io/v1`)
4. Restart the API server

## Architecture decisions

- File uploads use `multipart/form-data` via multer — frontend uses custom `fetch` with `FormData` (not the generated React Query mutation hook, which sends JSON)
- Analysis is async: POST returns immediately with `status: "processing"`, frontend polls every 2s until `complete` or `error`
- AI validation is deferred to request-time (not at import) so the server starts even if `AI_BASE_URL` is not yet configured
- pdf-parse uses `createRequire` (CJS compat) in the ESM server bundle

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API spec defines `POST /analyses` with `application/json` body for codegen purposes; the actual endpoint accepts `multipart/form-data`. Frontend uses custom fetch — do NOT use the generated `useCreateAnalysis` hook for file uploads.
- After changing `lib/api-spec/openapi.yaml`, always re-run `pnpm --filter @workspace/api-spec run codegen`.
- pdf-parse v2 ESM build lacks a default export — use `createRequire` to import it in the ESM server.
