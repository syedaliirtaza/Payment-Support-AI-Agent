# Payment Support AI Agent

This repo is a working attempt at an agent that can handle payment-support tickets on its own, and only mark a ticket for a human when it should not decide.

It is not production-ready. It is here so you can see what is actually implemented today, where it breaks, and how the two apps fit together.

## What you can try

1. Open the UI, pick or add a ticket.
2. Watch the agent walk through each step (customer lookup, policy retrieval, decision, reply).
3. Upload policy documents on the knowledgebase page so retrieval has something to search.
4. Read the decision and the drafted customer reply.

That is the whole loop right now: ticket in, streamed steps, decision + draft out.

## Repo layout

This is one repo with two apps:

| Folder | What it is |
| --- | --- |
| [backend/](backend/) | FastAPI + LangGraph agent. Talks to Pinecone and OpenAI. Billing is mocked. |
| [frontend/](frontend/) | Next.js UI: tickets, live agent run, knowledgebase upload. |

Each folder has its own README with run instructions.

## How a ticket is handled

The backend runs a fixed sequence. Refunds only go through the mock billing step when the model chooses `approve_refund`. Everything else skips that step and goes straight to writing a reply.

1. Extract ticket details
2. Look up the customer (mock Stripe, in-memory records)
3. Check subscription
4. Retrieve policy passages from Pinecone (top 4)
5. Reason and decide with OpenAI (`gpt-4o-mini`, structured JSON)
6. If approved: create a **mock** refund
7. Draft a support reply

Possible decisions: `approve_refund`, `deny_refund`, `answer_question`, `request_more_info`, `escalate_to_human`.

More detail: [backend/docs/architecture.md](backend/docs/architecture.md).

## What is actually true today

- Policy documents in the vector store are synthetic / incomplete. They are not a real company’s refund policy.
- Retrieval is hit-or-miss. The useful passage is not always in the top results.
- When retrieval finds little or nothing, the agent can still **deny a refund with high confidence** instead of escalating. That is a real failure, not a demo quirk.
- Billing is not Stripe. It is a mock API over a hard-coded customer list.
- `escalate_to_human` is only a label on the decision. There is no human inbox, assignment, or handoff.
- The Agent Configuration page in the UI says “coming soon” and does nothing.
- There is no eval set. We cannot score whether decisions are correct.

Do not treat a confident deny as proof that the policy forbids a refund. It often just means the synthetic docs did not contain a matching rule.

## Run it locally

You need an OpenAI key and a Pinecone key. Put them in `backend/.env` (see `backend/.env.example`). Do not commit `.env`.

```bash
# backend
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # then fill in keys
uvicorn app.main:app --reload --port 8000
```

```bash
# frontend (second terminal)
cd frontend
npm install
copy .env.example .env   # BACKEND_URL=http://localhost:8000
npm run dev
```

Open the Next.js URL it prints (usually `http://localhost:3000`). It redirects to `/new-tickets`.

## What this is not

This is not a product, not a live Stripe integration, and not something you should point at real customers or real money.
