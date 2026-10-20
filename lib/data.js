// Load the sample data from data/ in Node. In the browser, use the dev server's API instead
// (see server.js), or fetch the files from /data/ directly.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, parseTransactions } from "./analysis.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../data");
const readJson = (file) => JSON.parse(readFileSync(join(dataDir, file), "utf8"));

/** Every sample household: [{ id, name, people, area, home, income, ... }]. */
export const loadHouseholds = () => readJson("households.json");

/** One household's profile. */
export const loadHousehold = (id) => loadHouseholds().find((h) => h.id === id) ?? null;

/** What Nous knew from the WhatsApp signup, before the bank was connected. */
export const loadSignup = (id) => readJson(`signup/${id}.json`);

/** Bank description patterns to merchant, category and kind. */
export const loadMerchants = () => readJson("merchants.json");

/** Illustrative market prices: { note, monthly: { energy: { 1: 72, ... }, broadband: 27, ... } }. */
export const loadMarketPrices = () => readJson("market-prices.json");

/** A household's transactions, tagged with merchant and category. */
export const loadTransactions = (id) => parseTransactions(readFileSync(join(dataDir, `transactions/${id}.csv`), "utf8"), loadMerchants());

/** The signup funnel: one row per WhatsApp signup. Booleans and numbers are converted. */
export function loadFunnel() {
  return parseCsv(readFileSync(join(dataDir, "funnel.csv"), "utf8")).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value === "true" ? true : value === "false" ? false : value !== "" && !Number.isNaN(Number(value)) && key !== "signup_id" ? Number(value) : value]),
    ),
  );
}
