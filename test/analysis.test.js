// Run with `npm test`. Checks the helpers against the sample data.

import assert from "node:assert/strict";
import { test } from "node:test";
import { categorise, findRecurring, marketPrice, parseTransactions, pounds } from "../lib/analysis.js";
import { loadFunnel, loadHouseholds, loadMarketPrices, loadMerchants, loadTransactions } from "../lib/data.js";

test("every household has transactions and a signup", () => {
  for (const h of loadHouseholds()) assert.ok(loadTransactions(h.id).length > 100, h.id);
});

test("categorise matches the merchant list", () => {
  assert.deepEqual(categorise("NETFLIX.COM", loadMerchants()), { merchant: "Netflix", category: "streaming", kind: "subscription" });
  assert.equal(categorise("SOMEWHERE NEW 1234", loadMerchants()).category, "other");
});

test("findRecurring splits separate agreements with the same merchant", () => {
  const spotify = findRecurring(loadTransactions("hh_01")).filter((s) => s.merchant === "Spotify");
  assert.equal(spotify.length, 3);
  assert.ok(spotify.every((s) => s.cadence === "monthly"));
});

test("findRecurring spots four-weekly income and annual bills", () => {
  const pensions = findRecurring(loadTransactions("hh_03")).filter((s) => s.category === "pension" && s.cadence === "four-weekly");
  assert.equal(pensions.length, 2);
  const admiral = findRecurring(loadTransactions("hh_01")).find((s) => s.merchant === "Admiral");
  assert.equal(admiral.cadence, "annual");
});

test("findRecurring marks payments that have stopped", () => {
  const edf = findRecurring(loadTransactions("hh_06")).find((s) => s.merchant === "EDF Energy" && s.direction === "out");
  assert.equal(edf.active, false);
});

test("findRecurring records price changes", () => {
  const csv = "date,description,amount,type,balance\n2026-01-08,VIRGIN MEDIA,-78.50,DD,0\n2026-02-08,VIRGIN MEDIA,-78.50,DD,0\n2026-03-08,VIRGIN MEDIA,-84.20,DD,0\n";
  const [stream] = findRecurring(parseTransactions(csv, loadMerchants()));
  assert.equal(stream.priceChanges[0].percent, 7.3);
});

test("marketPrice looks up energy by household size", () => {
  assert.equal(marketPrice(loadMarketPrices(), "energy", { people: 4 }), 152);
  assert.equal(marketPrice(loadMarketPrices(), "broadband"), 27);
  assert.equal(marketPrice(loadMarketPrices(), "rent"), null);
});

test("pounds formats money", () => {
  assert.equal(pounds(1234.5), "£1,234.50");
  assert.equal(pounds(-8.99), "-£8.99");
  assert.equal(pounds(1234.5, 0), "£1,235");
});

test("the funnel loads with types converted", () => {
  const [first] = loadFunnel();
  assert.equal(typeof first.tapped_connect, "boolean");
  assert.equal(typeof first.household_size, "number");
});
