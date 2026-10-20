// Print a quick look at the sample data.
//   npm run explore            every household, plus the funnel
//   npm run explore hh_03      one household's recurring payments in full

import { findRecurring, monthlyByCategory, pounds } from "../lib/analysis.js";
import { loadFunnel, loadHouseholds, loadSignup, loadTransactions } from "../lib/data.js";

const id = process.argv[2];

function household(h, detail) {
  const transactions = loadTransactions(h.id);
  const recurring = findRecurring(transactions).filter((s) => s.direction === "out");
  const signup = loadSignup(h.id);
  console.log(`\n${h.id}  ${h.name}  ·  ${h.people} ${h.people === 1 ? "person" : "people"}  ·  ${h.area}`);
  console.log(`      ${transactions.length} transactions, ${h.from} to ${h.to}. Told Nora about: ${signup.billsMentioned.join(", ") || "nothing"}`);
  const rows = detail ? recurring : recurring.slice(0, 8);
  for (const s of rows) {
    const change = s.priceChanges.length ? `  changed ${s.priceChanges.map((c) => `${c.percent > 0 ? "+" : ""}${c.percent}% on ${c.date}`).join(", ")}` : "";
    console.log(`      ${s.merchant.padEnd(22)} ${s.category.padEnd(20)} ${s.cadence.padEnd(12)} ${pounds(s.latestAmount).padStart(10)}  ${pounds(s.yearlyCost, 0).padStart(7)}/yr${change}`);
  }
  if (!detail && recurring.length > rows.length) console.log(`      … and ${recurring.length - rows.length} more. Run: npm run explore ${h.id}`);
  if (detail) {
    console.log("\n      Spending by category, last full month:");
    const months = monthlyByCategory(transactions);
    const month = Object.keys(months).sort().at(-2);
    for (const [category, total] of Object.entries(months[month]).sort((a, b) => b[1] - a[1])) console.log(`      ${category.padEnd(22)} ${pounds(total).padStart(10)}`);
  }
}

if (id) {
  const h = loadHouseholds().find((x) => x.id === id);
  if (!h) throw new Error(`No household ${id}. Try one of: ${loadHouseholds().map((x) => x.id).join(", ")}`);
  household(h, true);
} else {
  for (const h of loadHouseholds()) household(h, false);
  const funnel = loadFunnel();
  const share = (rows) => `${Math.round((rows.filter((r) => r.connected).length / rows.length) * 100)}%`;
  console.log(`\nFunnel  ${funnel.length} WhatsApp signups, ${share(funnel)} connected their bank`);
  console.log(`        ${funnel.filter((r) => r.tapped_connect).length} tapped Connect, ${funnel.filter((r) => r.consented).length} consented, ${funnel.filter((r) => r.bank_authorised).length} authorised with their bank`);
}
console.log("");
