# AI User Survey

RUN THE PROJECT USING:
```bash npm run dev```

---

## Prerequisites

| Tool | Minimum version | How to check |
|------|----------------|--------------|
| [Node.js](https://nodejs.org) | 20.x | `node -v` |
| npm | 10.x (bundled with Node 20) | `npm -v` |

No other global tools are required.

---

## Installation

Clone the repository (or copy the project folder), then install all dependencies from the **root** of the project:

```bash
npm install
```

This installs packages for all three workspaces (`shared`, `backend`, `frontend`) in one step.

---

## Survey Schema

The survey schema (`survey-schema/survey.v1-draft.json`) is already generated and committed. If you ever need to regenerate it from the source `.txt` file:

```bash
# Regenerate schema from source text file
npm run parse:survey

# Validate the schema (must pass before use)
npm run lint:schema
```

Promote the draft to production by copying it:

```bash
cp survey-schema/survey.v1-draft.json survey-schema/survey.v1.json
```

The backend automatically prefers `survey.v1.json` over `survey.v1-draft.json`.

---

## Development

Run both backend and frontend simultaneously:

```bash
npm run dev
```

- **Frontend** (React + Vite): `http://localhost:5173`
- **Backend** (Express API): `http://localhost:3000`
- Vite proxies all `/api` requests to the backend automatically — no CORS setup needed in dev.

---

## Production

**1. Build everything:**

```bash
npm run build
```

This compiles the shared package, the backend TypeScript, and bundles the frontend into `frontend/dist/`.

**2. Start the server:**

```bash
NODE_ENV=production node backend/dist/server.js
```

In production mode the backend serves the frontend from `frontend/dist/` and handles all routes.

**Environment variables** (set before starting):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | CORS allowed origin — set to your deployed domain |
| `NODE_ENV` | — | Set to `production` to enable static file serving and file-based logging |

Example:

```bash
PORT=8080 ALLOWED_ORIGIN=https://your-domain.com NODE_ENV=production node backend/dist/server.js
```

---

## Response Data

Submissions are written to the `data/` directory (created automatically on first run):

```
data/
├── logs/                  # Server logs (production only, one file per day)
├── responses/
│   ├── _schemas/          # Immutable copy of the schema used at submission time
│   └── YYYY-MM-DD/        # One JSON file per submission, named by UUID
└── contact-emails/
    └── opt-ins.jsonl      # Email addresses from participants who opted in
```

### Exporting responses to CSV

```bash
npm run export:csv
```

Reads all response JSON files and writes a CSV to `data/responses.csv`.

---

## Project Structure

```
.
├── shared/          # TypeScript types and shared logic (visibility engine, validation)
├── backend/         # Express API server
├── frontend/        # React + Vite survey app
├── scripts/         # parse-survey-txt.ts, lint-schema.ts, export-csv.ts
├── survey-schema/   # Generated survey JSON
└── data/            # Runtime output — responses, logs (gitignored)
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start backend + frontend in development mode |
| `npm run build` | Build all packages for production |
| `npm run parse:survey` | Regenerate survey schema from the source `.txt` file |
| `npm run lint:schema` | Validate the survey schema for correctness |
| `npm run export:csv` | Export all collected responses to `data/responses.csv` |
| `npm test` | Run backend unit tests |
