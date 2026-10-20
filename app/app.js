// Starter script. It fills the household picker and shows how to load a household's data.
// The screen itself is still today's static version: making it better is the task.

import { pounds } from "/lib/analysis.js";

const picker = document.querySelector("#household");
const households = await fetch("/api/households").then((r) => r.json());
picker.innerHTML = households.map((h) => `<option value="${h.id}">${h.id} · ${h.name}</option>`).join("");

const params = new URLSearchParams(location.search);
picker.value = params.get("household") ?? households[0].id;
picker.addEventListener("change", () => {
  params.set("household", picker.value);
  location.search = params;
});

const household = await fetch(`/api/households/${picker.value}`).then((r) => r.json());
const recurring = await fetch(`/api/households/${picker.value}/recurring`).then((r) => r.json());

// Open the browser console to see what you have to work with.
console.log("Household", household);
console.log("What Nous knew at signup", household.signup);
console.log(
  "Recurring payments",
  recurring.filter((s) => s.direction === "out").map((s) => `${s.merchant}: ${pounds(s.latestAmount)} ${s.cadence}${s.active ? "" : " (stopped)"}`),
);

document.querySelector("#connect").addEventListener("click", () => {
  console.log("Connect tapped. In this prototype there's no real bank connection: the sample data stands in for it.");
});
