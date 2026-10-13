# Frontend

Next.js UI for the payment-support agent.

It does not run the model. It talks to the FastAPI backend (directly in local dev, or through `src/app/api/[...path]/route.ts` when `BACKEND_URL` is set).

## What you get

- **New Tickets** (`/new-tickets`) — list and add tickets (stored in the browser)
- **Ticket run** (`/new-tickets/[ticketId]`) — streams each agent step, retrieved policy chunks, the decision, and the drafted reply
- **Knowledgebase** (`/knowledgebase`) — upload or paste documents that the backend indexes in Pinecone
- **Agent Configuration** (`/agent-configuration`) — placeholder page (“coming soon”)

Home (`/`) redirects to `/new-tickets`.

## Setup

You need the backend running on port 8000 (see `../backend/README.md`).

```bash
npm install
copy .env.example .env
# .env should contain:
# BACKEND_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`.

`BACKEND_URL` has no trailing slash. If it is missing, API routes return 503.

## Limits

- Tickets live in browser storage, not a database.
- You are watching a mock billing lookup plus RAG over synthetic docs. A deny in the UI can be the model filling a gap, not a real policy.
- There is no screen for a human to pick up an escalated ticket.
