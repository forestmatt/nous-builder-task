// Helpers for working with the sample bank data. Plain JavaScript with no dependencies,
// so the same file works in Node and in the browser:
//
//   import { parseTransactions, findRecurring } from "/lib/analysis.js";   // browser
//   import { parseTransactions, findRecurring } from "./lib/analysis.js";  // Node
//
// These do the plumbing. Deciding what matters to a household is up to you.

const DAY = 24 * 60 * 60 * 1000;

/** Days between two "YYYY-MM-DD" dates. */
export const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

/** Add days to a "YYYY-MM-DD" date. */
export const addDays = (date, days) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);

/** Format a number as pounds: pounds(1234.5) -> "£1,234.50", pounds(1234.5, 0) -> "£1,235". */
export function pounds(amount, decimals = 2) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}£${Math.abs(amount).toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Parse simple CSV (no quoted commas) into objects keyed by the header row. */
export function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, i) => [keys[i], value])));
}

/**
 * Look up a bank description in data/merchants.json.
 * Returns { merchant, category, kind }. kind is one of: bill, subscription, insurance, debt,
 * income, spend, transfer, fee. Unknown descriptions come back as category "other".
 */
export function categorise(description, merchants) {
  const upper = description.toUpperCase();
  const match = merchants.find((m) => upper.includes(m.pattern));
  if (match) return { merchant: match.merchant, category: match.category, kind: match.kind };
  return { merchant: description.replace(/\s+[A-Z0-9]*\d[A-Z0-9]*.*$/, "").trim() || description, category: "other", kind: "spend" };
}

/**
 * Parse a household's transactions CSV and tag each row with its merchant and category.
 * Each row: { date, description, amount, type, balance, merchant, category, kind }.
 * amount is negative for money out. type is the bank's code: DD direct debit, SO standing
 * order, CARD card payment, BGC bank giro credit, FPI faster payment in, FPO faster payment out.
 */
export function parseTransactions(csv, merchants = []) {
  return parseCsv(csv).map((row) => ({
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    balance: Number(row.balance),
    ...categorise(row.description, merchants),
  }));
}

const CADENCES = [
  { name: "weekly", days: 7, slack: 2 },
  { name: "four-weekly", days: 28, slack: 2 },
  { name: "monthly", days: 30.4, slack: 4 },
  { name: "quarterly", days: 91, slack: 10 },
  { name: "annual", days: 365, slack: 20 },
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Find recurring payments (and income) in a list of transactions from parseTransactions.
 *
 * Payments to the same merchant are split into separate streams when they look like
 * separate agreements (two phone contracts, three Spotify accounts), using amount and
 * day of the month. A stream needs at least two payments, so an annual bill only shows
 * up once it has been paid twice in the data.
 *
 * Returns streams like:
 *   { merchant, category, kind, direction: "out" | "in", cadence, payments: [{ date, amount, description }],
 *     latestAmount, averageAmount, firstDate, lastDate, nextDue, active, yearlyCost, priceChanges: [{ date, from, to, percent }] }
 *
 * active is false when the payments have stopped (the next one is overdue at the end of the data).
 *
 * Everyday spending (kind "spend") is left out unless you pass { includeSpend: true }.
 */
export function findRecurring(transactions, { includeSpend = false } = {}) {
  const dataEnd = transactions.reduce((latest, t) => (t.date > latest ? t.date : latest), "");
  const groups = new Map();
  for (const t of transactions) {
    if (t.kind === "transfer" || (!includeSpend && t.kind === "spend")) continue;
    const key = `${t.merchant}|${t.amount < 0 ? "out" : "in"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }

  const streams = [];
  for (const group of groups.values()) {
    const open = [];
    for (const t of [...group].sort((a, b) => a.date.localeCompare(b.date))) {
      const day = Number(t.date.slice(8, 10));
      let best = null;
      for (const stream of open) {
        const last = stream.at(-1);
        const ratio = Math.abs(Math.abs(t.amount) - Math.abs(last.amount)) / Math.abs(last.amount);
        if (daysBetween(last.date, t.date) < 20 || ratio > 0.3) continue;
        const dayGap = Math.min(Math.abs(day - Number(last.date.slice(8, 10))), 31 - Math.abs(day - Number(last.date.slice(8, 10))));
        const score = ratio * 10 + dayGap / 31;
        if (!best || score < best.score) best = { stream, score };
      }
      if (best) best.stream.push(t);
      else open.push([t]);
    }

    for (const payments of open) {
      if (payments.length < 2) continue;
      const gaps = payments.slice(1).map((p, i) => daysBetween(payments[i].date, p.date));
      const gap = median(gaps);
      // Four-weekly payments land exactly 28 days apart; monthly ones drift between 28 and 31.
      const steady = Math.max(...gaps) - Math.min(...gaps) <= 2;
      const cadence = CADENCES.filter((c) => Math.abs(gap - c.days) <= c.slack && (c.name !== "four-weekly" || steady)).sort(
        (a, b) => Math.abs(gap - a.days) - Math.abs(gap - b.days),
      )[0];
      if (!cadence) continue;

      const amounts = payments.map((p) => Math.abs(p.amount));
      const priceChanges = [];
      for (let i = 1; i < payments.length; i++) {
        const from = amounts[i - 1];
        const to = amounts[i];
        if (Math.abs(to - from) / from > 0.01) priceChanges.push({ date: payments[i].date, from, to, percent: Math.round(((to - from) / from) * 1000) / 10 });
      }
      const last = payments.at(-1);
      streams.push({
        merchant: last.merchant,
        category: last.category,
        kind: last.kind,
        direction: last.amount < 0 ? "out" : "in",
        cadence: cadence.name,
        payments: payments.map(({ date, amount, description }) => ({ date, amount, description })),
        latestAmount: amounts.at(-1),
        averageAmount: Math.round((amounts.reduce((a, b) => a + b, 0) / amounts.length) * 100) / 100,
        firstDate: payments[0].date,
        lastDate: last.date,
        nextDue: addDays(last.date, Math.round(cadence.days)),
        // Still being paid: the next payment isn't overdue at the end of the data.
        active: daysBetween(last.date, dataEnd) <= cadence.days + cadence.slack,
        yearlyCost: Math.round(amounts.at(-1) * (365 / cadence.days) * 100) / 100,
        priceChanges,
      });
    }
  }
  return streams.sort((a, b) => b.yearlyCost - a.yearlyCost);
}

/** Total money out per category per month: { "2026-09": { energy: 212, groceries: 548.2, ... } }. */
export function monthlyByCategory(transactions) {
  const months = {};
  for (const t of transactions) {
    if (t.amount >= 0 || t.kind === "transfer") continue;
    const month = t.date.slice(0, 7);
    months[month] ??= {};
    months[month][t.category] = Math.round(((months[month][t.category] ?? 0) - t.amount) * 100) / 100;
  }
  return months;
}

/**
 * The illustrative market price for a category, from data/market-prices.json.
 * Energy depends on household size: marketPrice(prices, "energy", { people: 4 }).
 * Returns a monthly price in pounds, or null if there's no benchmark.
 */
export function marketPrice(prices, category, { people = 2 } = {}) {
  const entry = prices.monthly[category];
  if (entry == null) return null;
  if (typeof entry === "number") return entry;
  return entry[String(Math.min(Math.max(people, 1), 5))] ?? null;
}
