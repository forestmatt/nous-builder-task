# Nous builder task

A two-hour prototype. The candidate is building something that gets more people who sign up to Nous on WhatsApp to connect their bank. Only 24% do today.

Nous is an AI agent that runs household bills, insurance and subscriptions. Members mostly talk to Nora, its WhatsApp agent. Connecting a bank lets Nous see every bill and act on it.

## Commands

- `npm run dev`: dev server at http://localhost:3000, restarts on change. Serves `app/` at `/`, plus `/lib/`, `/data/`, `/assets/` and a JSON API (listed at the top of `server.js`).
- `npm run explore [hh_01]`: print a summary of the sample households.
- `npm test`: tests for `lib/` with `node:test`.

## Data

- `data/households.json`: six households (`hh_01` to `hh_06`). Their transactions are in `data/transactions/<id>.csv`, a year from 1 October 2025.
- `data/signup/<id>.json`: what Nous knew from WhatsApp before the bank was connected.
- `data/merchants.json`: bank description pattern → merchant, category, kind.
- `data/market-prices.json`: illustrative monthly market prices.
- `data/funnel.csv`: 2,000 signups and how far each got through bank connection.
- Column meanings are in `data/README.md`. Amounts are pounds, negative for money out.

## Helpers

Use `lib/analysis.js` (works in Node and the browser) rather than re-parsing CSVs: `parseTransactions`, `categorise`, `findRecurring` (recurring streams with cadence, price changes, `active`), `monthlyByCategory`, `marketPrice`, `pounds`. In Node, `lib/data.js` loads everything.

## Working style

- It's a prototype: favour something that runs end to end over polish. No real bank connection or payments.
- No dependencies so far. Add one only if it saves real time.
- Small commits with clear messages, so the history shows how the work went.
- Keep `NOTES.md` up to date: what was built and why, what was left out, what's next.
