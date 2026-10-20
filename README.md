# Nous builder task

The starter repo for the Nous builder task. The task itself appears in the Nous Product Interview Hub when you start the timer.

## Before you start

You need Node.js 22 or later, Git and [Claude Code](https://claude.com/claude-code).

```sh
npm install      # nothing to download, but it checks your Node version
npm test         # checks the helpers and the sample data
npm run dev      # starter app at http://localhost:3000
```

If all three work, you're ready.

## What's here

| Path | What it is |
|---|---|
| `data/` | Sample data: six households with a year of bank transactions each, what Nous knew about them from WhatsApp signup, and a funnel of 2,000 signups. See [data/README.md](data/README.md). |
| `lib/analysis.js` | Helpers that work in Node and the browser: parse transactions, tag merchants, find recurring payments and price changes, look up market prices. |
| `lib/data.js` | Loads the sample data in Node. |
| `server.js` | A tiny dev server with a JSON API over the data. No dependencies. |
| `app/` | A starter app: today's bank connection screen, with a household picker. |
| `scripts/explore.js` | `npm run explore` prints a summary of every household. `npm run explore hh_03` shows one in full. |
| `assets/` | A screenshot of the bank connection screen today. |
| `NOTES.md` | Write your notes here before the time is up. |

You don't have to use any of it. Change the stack, add a framework, or start again in `app/` if that's quicker for you.

## When the task starts

Open Claude Code in this folder:

```sh
claude
```

Commit as you go, and write your notes in `NOTES.md` before the time is up.

All the data is made up. There's no real bank connection: the sample transactions stand in for what Nous would see once a household connects.
