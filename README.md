# Cold Call Companion

> **FDE Assignment — DeepThought CultureTech**
> A live cold-call workspace for Forward Deployed Engineers: stage-by-stage guidance, prospect notes, and AI-powered call summaries.

---

## Architecture

```
┌─────────────────────────────────┐     HTTP/JSON     ┌──────────────────────────┐
│  React + Vite (app/)            │ ◄───────────────► │  Node.js + Express       │
│  Precision Slate design system  │                   │  (server/)               │
│  Runs on: localhost:5173        │                   │  Runs on: localhost:3001  │
└─────────────────────────────────┘                   └──────────┬───────────────┘
                                                                  │
                                          ┌───────────────────────┼──────────────┐
                                          ▼                       ▼              ▼
                                   Supabase Postgres        Gemini API    .env secrets
                                   (calls, stage_results)   (AI summaries)
```

**Security rules:**
- The browser never sees `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY`.
- Only `VITE_API_BASE_URL` is embedded in the browser bundle.
- Row Level Security is enabled on all tables; the backend uses the service_role key (bypasses RLS), no public policies exist.

---

## Folder Structure

```
COLD CALL Companion/
├── app/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── callsApi.js   # All backend HTTP calls
│   │   ├── components/       # UI components (preserved from Phase 1)
│   │   ├── data/mockData.js  # Stage defs, OUTCOMES, localStorage helpers
│   │   └── App.jsx           # Root: state, routing, API wiring
│   ├── .env                  # VITE_API_BASE_URL (not secret)
│   └── vite.config.js        # Dev proxy → Express backend
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js        # Env var validation
│   │   │   └── supabase.js   # Supabase client (service_role)
│   │   ├── services/
│   │   │   ├── callsService.js   # All DB operations
│   │   │   └── geminiService.js  # Gemini AI integration
│   │   ├── controllers/
│   │   │   └── callsController.js
│   │   ├── routes/
│   │   │   ├── calls.js
│   │   │   └── health.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── __tests__/
│   │   │   └── calls.test.js  # Integration test suite
│   │   └── index.js           # Express entry point
│   ├── .env                   # Server secrets (never commit)
│   └── .env.example           # Template
│
├── database/
│   └── schema.sql             # Supabase PostgreSQL schema
│
├── .gitignore                 # Root: excludes .env, node_modules, etc.
└── README.md
```

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) Gemini API key

---

## 1. Supabase Setup

### Create the schema

1. Go to **Supabase Dashboard → your project → SQL Editor → New Query**
2. Copy the full contents of [`database/schema.sql`](./database/schema.sql)
3. Paste and click **Run**
4. Verify: run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
   — you should see `calls` and `stage_results`

### Get your credentials

- **SUPABASE_URL**: Project Settings → API → Project URL
- **SUPABASE_SECRET_KEY**: Project Settings → API → `service_role` key *(keep this secret)*

> ⚠️ Do **not** use the `anon` key in the server. Use `service_role`.

---

## 2. Environment Variables

### Backend (`server/.env`)

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-service-role-secret-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (`app/.env`)

```bash
cp app/.env.example app/.env
```

Default content (no changes needed for local dev):

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## 3. Installation

```bash
# Install server dependencies
cd server && npm install

# Install frontend dependencies
cd ../app && npm install
```

---

## 4. Running Locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → [CCC Server] Running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd app
npm run dev
# → Local: http://localhost:5173
```

Then open **http://localhost:5173**

---

## 5. API Reference

All endpoints return JSON. Errors use `{ "error": { "message": "..." } }`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — `{ status: "ok" }` |
| `POST` | `/api/calls` | Create a new in-progress call |
| `GET` | `/api/calls` | List all calls, newest first |
| `GET` | `/api/calls/:id` | Get one call + stage results |
| `PUT` | `/api/calls/:id/stages/:n` | Save/update stage n (1–8), idempotent |
| `POST` | `/api/calls/:id/close` | Close with outcome + next step |
| `POST` | `/api/calls/:id/suggest-close` | Get Gemini AI suggestion (advisory) |

### Example: Create a call
```json
POST /api/calls
{
  "prospectName": "Ananya Sharma",
  "company": "Meridian Growth",
  "prospectTitle": "CTO",
  "phone": "+91 98000 00000",
  "email": "ananya@meridian.com",
  "location": "Bangalore"
}
```

### Example: Save stage 1
```json
PUT /api/calls/:id/stages/1
{
  "whatHappened": ["right_person", "engaged"],
  "prospectWords": "Yes, this is Ananya. I have about 5 minutes."
}
```

### Example: Close a call
```json
POST /api/calls/:id/close
{
  "outcome": "next_step_agreed",
  "nextStep": "Demo call Thursday 3 PM",
  "summary": "Strong interest in data pipeline solution.",
  "summarySource": "manual",
  "furthestStage": 6
}
```

**Valid outcomes:** `not_interested` · `agreed_to_receive_report` · `follow_up` · `not_logged` · `next_step_agreed` · `do_not_call` · `wrong_person` · `interested` · `moved_company` · `call_again`

---

## 6. Gemini AI Integration

The `POST /api/calls/:id/suggest-close` endpoint:

1. Reads all saved stage notes for the call from Supabase
2. Builds a structured prompt (stage notes treated as untrusted DATA, not instructions)
3. Asks Gemini for a JSON response: `{ summary, suggested_outcome, reason, suggested_next_step, confidence }`
4. Validates the response — rejects any invalid outcome value
5. Returns the suggestion to the UI

**Failure handling:**
- Request timeout (15s): returns `{ aiAvailable: false, error: { type: "timeout" } }`
- Quota exceeded: returns `{ aiAvailable: false, error: { type: "quota" } }`
- Invalid JSON from model: caught and returned as error, call data is safe
- The UI shows the failure and lets the user close the call manually
- **The caller's manually selected outcome is never overridden by the AI**

**Model:** Configured via `GEMINI_MODEL` env var. Default: `gemini-3.5-flash`.

---

## 7. Testing

```bash
# Start the server first (needs real Supabase connection)
cd server && npm run dev

# In a second terminal, run the test suite
cd server && npm test
```

Tests cover:
- `GET /health` — health check
- `POST /api/calls` — validation (missing name, empty name)
- Full lifecycle: create → save stages → early close
- Idempotent upsert (stage saved twice = one row)
- Furthest-stage invariant (never decreases on backward navigation)
- Unicode in prospect words
- Invalid stage numbers (0, 9)
- Invalid outcome values
- Closing an already-closed call
- Updating stages on a closed call
- Unknown call ID → 404
- AI suggest-close on unknown call → 404

---

## 8. Security Notes

> ⚠️ **This is a demo backend without user authentication.**

- No user login, no session tokens, no per-user data isolation
- Anyone with network access to the server can read/write all calls
- Row Level Security is enabled on Supabase tables, but the service_role key bypasses it — intentional for the demo backend
- Do not use the `anon` Supabase key in the server; it would expose data to public browser access
- Do not expose `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` in any `VITE_` prefixed variable
- For production: add authentication (Supabase Auth, Clerk, or similar) and user-scoped RLS policies

---

## 9. Deployment (Render + Vercel — to be completed)

### Backend (Render)
1. Create a new **Web Service** on Render
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all env vars from `server/.env.example` in the Render dashboard
6. Set `FRONTEND_ORIGIN` to your Vercel frontend URL

### Frontend (Vercel)
1. Import the repository to Vercel
2. Set root directory to `app/`
3. Add `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
4. Deploy

---

## Known Limitations

- No authentication — all data is shared across sessions
- `advance_furthest_stage` Supabase RPC may not exist (schema.sql uses a JS fallback)
- AI suggestion depends on stage notes being saved before calling suggest-close
- No rate limiting on the API
- No pagination on `GET /api/calls` (returns all records)
