# Sample data

Everything here is made up, but shaped like the real thing. Six households, each with a year of bank transactions (1 October 2025 to 15 October 2026), plus a funnel of 2,000 WhatsApp signups.

## households.json

One entry per household: `id`, `name`, `people`, `adults`, `children`, `area`, `home`, `income`, and paths to its files.

| id | Household |
|---|---|
| `hh_01` | The Okafor household, family of four, Croydon |
| `hh_02` | Priya, flatshare, Hackney |
| `hh_03` | Pat and Brian Hughes, retired, Leeds |
| `hh_04` | Sam and Alex, couple, Bristol |
| `hh_05` | Dan, freelancer, Manchester |
| `hh_06` | The Clarke household, family of three, Norwich |

## transactions/<id>.csv

| Column | Meaning |
|---|---|
| `date` | `YYYY-MM-DD` |
| `description` | As it appears on the bank statement |
| `amount` | Pounds. Negative is money out |
| `type` | `DD` direct debit, `SO` standing order, `CARD` card payment, `BGC` bank credit (salary, pension), `FPI` / `FPO` faster payment in / out, `FEE` bank charge |
| `balance` | Running balance after the transaction |

## signup/<id>.json

What Nous knew before the bank was connected: `signedUpAt`, `source` (how they found Nous), `firstName`, a partial `postcode`, `householdSize`, `billsMentioned` (what they told Nora about) and the `whatsapp` conversation with Nora.

## merchants.json

`[{ pattern, merchant, category, kind }]`. A transaction matches the first entry whose `pattern` appears in its description. `kind` is `bill`, `subscription`, `insurance`, `debt` (credit cards, buy now pay later), `income`, `spend`, `transfer` or `fee`. Not every description has a match, just like real bank data.

## market-prices.json

Illustrative monthly prices for a good deal, by category, in pounds. Energy is by number of people. These are not live quotes.

## funnel.csv

One row per WhatsApp signup between 1 June and 15 October 2026, in order.

| Column | Meaning |
|---|---|
| `signup_id` | Anonymous id |
| `signed_up_at` | ISO timestamp |
| `source` | `instagram`, `tiktok`, `referral`, `google` or `press` |
| `household_size` | What they told Nora |
| `bills_mentioned` | How many bills they mentioned to Nora during signup |
| `tapped_connect` | Tapped **Connect bank account** on the screen in `assets/` |
| `bank` | The bank they picked, if they tapped |
| `consented` | Accepted the Open Banking consent screen |
| `bank_authorised` | Completed authorisation in their bank's app |
| `connected` | Ended up connected, including after a reminder |
| `dropped_at` | Where they stopped: `connect_screen`, `consent_screen` or `bank_authorisation`. Empty if connected |
| `seconds_on_connect_screen` | Time on the connect screen |
| `reminder_sent` | Sent a WhatsApp reminder the next day |
| `connected_after_reminder` | Connected after that reminder |
