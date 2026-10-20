// A tiny dev server with no dependencies. Run with `npm run dev`, then open http://localhost:3000
//
// It serves app/ at /, plus /lib/, /data/ and /assets/, and a small JSON API so the browser
// doesn't have to parse CSV:
//
//   GET /api/households                       every household
//   GET /api/households/:id                   one household, with what Nous knew at signup
//   GET /api/households/:id/transactions      tagged transactions
//   GET /api/households/:id/recurring         recurring payments and income (findRecurring)
//   GET /api/market-prices                    illustrative market prices
//   GET /api/funnel                           the signup funnel, one row per signup
//
// Add your own routes in handleApi below if you need them.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { findRecurring } from "./lib/analysis.js";
import { loadFunnel, loadHousehold, loadHouseholds, loadMarketPrices, loadSignup, loadTransactions } from "./lib/data.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".png": "image/png", ".svg": "image/svg+xml" };

function handleApi(path) {
  if (path === "/api/households") return loadHouseholds();
  if (path === "/api/market-prices") return loadMarketPrices();
  if (path === "/api/funnel") return loadFunnel();
  const match = path.match(/^\/api\/households\/(hh_\d+)(\/transactions|\/recurring)?$/);
  if (!match) return undefined;
  const [, id, part] = match;
  if (!loadHousehold(id)) return null;
  if (part === "/transactions") return loadTransactions(id);
  if (part === "/recurring") return findRecurring(loadTransactions(id));
  return { ...loadHousehold(id), signup: loadSignup(id) };
}

createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  try {
    if (path.startsWith("/api/")) {
      const body = handleApi(path);
      response.writeHead(body == null ? 404 : 200, { "content-type": "application/json" });
      return response.end(JSON.stringify(body ?? { error: "Not found" }));
    }
    // /lib, /data and /assets come from the repo; everything else from app/.
    const shared = ["/lib/", "/data/", "/assets/"].some((prefix) => path.startsWith(prefix));
    const file = normalize(join(root, shared ? "" : "app", path.endsWith("/") ? `${path}index.html` : path));
    if (!file.startsWith(root)) throw new Error("Outside the repo");
    const content = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
}).listen(port, () => console.log(`Nous builder task running at http://localhost:${port}`));
