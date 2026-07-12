# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Anonymous disposable-email service ("tmail"). Cloudflare Email Routing forwards incoming mail to a Cloudflare Worker (`doc/workers.js`), which POSTs the raw MIME to `/api/report`. The Go backend parses and stores it; the frontend polls for new mail and displays it. Emails and attachments are auto-deleted after 10 days (`internal/schedule`).

Single deployable artifact: the Astro frontend is built to `web/dist`, then embedded into the Go binary via `//go:embed dist/*` in `web/web.go`. **The Go build will fail (or serve a stale/empty frontend) unless `web/dist` has already been built** — always run the frontend build before `go build`/`go run` when frontend files changed or `web/dist` doesn't exist yet.

## Commands

Backend (run from repo root):
```
go build -o tmail cmd/main.go   # build binary
go run ./cmd                    # run backend (requires web/dist to exist, see above)
go test ./...                   # run all tests
go test ./internal/utils/...    # run a single package's tests
go generate ./ent               # regenerate Ent ORM code after editing ent/schema/*.go
```

Frontend (run from `web/`, uses bun):
```
bun install
bun run dev       # astro dev server, proxies /api to the URL in astro.config.mjs
bun run build     # outputs to web/dist (required before building/running the Go backend)
bun run preview
bun run fmt        # prettier --write
```

Full production build mirrors `Dockerfile`: build frontend into `web/dist` first, then `go build` from repo root.

Config: copy `.env.example` to `.env` (loaded automatically via godotenv on backend startup). `DOMAIN_LIST` is required; backend needs a reachable PostgreSQL instance (`DB_*` vars).

## Architecture

**Backend** — Go 1.25, Echo v4, Ent ORM, PostgreSQL only.
- `cmd/main.go` → `internal.NewApp().Run()` (`internal/app.go`): loads config, connects Ent, starts the hourly cleanup scheduler, wires Echo middleware (i18n path-rewrite `Pre`, custom `api.Context` injection, recover, CORS), registers `/api` routes, then serves the embedded frontend at `/`.
- `internal/api/context.go` defines a custom `api.Context` (wraps `echo.Context` + `*config.Config` + `*ent.Client`). Handlers are plain `func(*api.Context) error` and get registered via `api.Wrap(...)` (see `internal/route/route.go`) rather than the standard Echo handler signature — always use this pattern for new endpoints.
- Routes (`internal/route/route.go`): `POST /api/report` (ingest raw MIME from the Cloudflare Worker via `enmime`), `GET /api/fetch` (paginated list by `to`, max limit 200), `GET /api/fetch/:id` (full detail), `GET /api/fetch/latest` (long-poll, up to 1 min, via `internal/pubsub`), `GET /api/download/:id`, `GET /api/domain`.
- **No auth**: access control is knowing the random mailbox address. `ADMIN_ADDRESS` (env) is a single hardcoded address that bypasses the `to` filter on fetch/long-poll and subscribes to the special `pubsub.SubAll` channel to see all mail.
- `internal/pubsub/pubsub.go`: in-memory pub/sub (no external broker) keyed by recipient address, used to implement long-polling in `FetchLatest`. Subscriber channels are buffered size 1; `Publish` strips `Content` before fanning out (list/notify payloads never carry full email body).
- Attachments are stored on disk under `BASE_DIR/md5(to)[:16]/md5(filename)` (see `internal/api/report.go`); DB only stores metadata + filepath.
- `ent/schema/` defines two entities: `Envelope` (to/from/subject/content/created_at, indexed on `to`) and `Attachment` (owned-by envelope). After editing schema files, run `go generate ./ent` to regenerate `ent/` client code — do not hand-edit generated files.

**Frontend** — Astro 5 + React 19 islands, Tailwind CSS 4, nanostores, bun.
- `web/src/pages/[lang]/index.astro` is the main page; backend's `i18n` middleware in `internal/app.go` rewrites `/` to `/{lang}/` based on `Accept-Language` (Googlebot forced to `zh`).
- `web/src/components/Content.tsx` is the main inbox island: fetch list, long-poll for new mail, infinite scroll.
- `web/src/lib/store/store.ts`: nanostores persistent state — `$address` (current mailbox), `$history`, `$domainList`.
- `web/astro.config.mjs` dev proxy currently points `/api` at a remote host — change this locally to point at your own backend (e.g. `http://127.0.0.1:3000`) when developing against a local Go server.
- shadcn/ui-style primitives live in `web/src/components/ui/`; i18n strings (en/zh) in `web/src/i18n/ui.ts`.

## Deployment

`Dockerfile` is multi-stage: bun builds the frontend into `web/dist`, then the Go stage copies that into `web/dist` before compiling (`CGO_ENABLED=0`), then an alpine runtime stage. CI (`.github/workflows/docker.yml`) builds/pushes multi-arch images to Docker Hub (`sunls24/tmail`) on release. See `deploy.md` for the Cloudflare Email Routing + Worker setup this project depends on for receiving mail.
