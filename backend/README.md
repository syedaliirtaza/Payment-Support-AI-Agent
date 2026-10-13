# Backend

FastAPI app that runs the payment-support agent.

The UI in `../frontend` calls this API. Progress is streamed as Server-Sent Events from `POST /api/v1/tickets/resolve`.

## What it does

A LangGraph graph in `app/agent/graph.py` runs these nodes in order:

1. `extract_ticket` — structure the incoming ticket
2. `retrieve_customer` — look up email in the mock Stripe store
3. `check_subscription` — load that customer’s subscriptions
4. `retrieve_policy` — semantic search in Pinecone (`top_k=4`)
5. `reason_decide` — OpenAI structured output (`gpt-4o-mini`) picks one action
6. `execute_action` — only if the action is `approve_refund`; writes a fake refund id
7. `generate_response` — draft the customer-facing reply

If the OpenAI call in the decide step fails, the graph falls back to `escalate_to_human`. That still does not send anything to a person.

Billing lives in `app/tools/stripe_mock.py` and `app/data/customers.py`. There is no live Stripe key in this project.

Knowledge upload (PDF / TXT / MD / JSON or pasted text) is under `/api/v1/knowledge`. Pinecone embeds and stores chunks.

See [docs/architecture.md](docs/architecture.md) for the same flow as a diagram.

## Setup

Python 3.11+ recommended.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # then fill keys
uvicorn app.main:app --reload --port 8000
```

Health: `GET http://localhost:8000/` should return JSON with `"status": "ok"`.

API prefix: `/api/v1`.

## Environment

Copy `.env.example` to `.env`. Required:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Reasoning and reply drafting |
| `PINECONE_API_KEY` | Policy index |

The other Pinecone fields have defaults that match `app/core/config.py` (index name `payment-support-knowledge`, namespace `knowledge`, embed model `multilingual-e5-large`). Set `CORS_ALLOW_ORIGINS` if the frontend is not on the same origin the server already allows.

Never commit `.env`.

## Limits that show up here

- Mock customers only. Unknown emails come back as “not found”.
- Incomplete synthetic policy in the vector index.
- Missing policy often still produces a confident `deny_refund`.
- Escalation is a field on the JSON decision, not a queue.
