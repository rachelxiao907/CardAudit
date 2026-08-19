# CardAudit — Implementation Outline

Skeletons only — signatures, file structure, and test case *descriptions*, not filled-in logic. Fill in the bodies yourself. Each step lists what to research if you get stuck.

Reflects current decisions: generalized `Category`/`Card` (not Chase-specific), CSV-only (no PDF parser), `POST /audit` kept for API practice, multipliers left as `TODO` until you fill in real values.

---

## Step 1 — Types

### `src/types/transaction.ts`
```ts
type Category = string;

interface Transaction {
  transactionDate: Date;
  description: string;
  category: Category;
  type: "Sale" | "Adjustment" | "Payment" | "Fee" | "Return";
  amountCents: number;
}

export { Transaction, Category };
```

**Note:** `postDate` was dropped — nothing in the audit logic uses it, and YAGNI (you aren't gonna need it) applies. Easy to add back later if a real need shows up. `type` now includes `"Fee"` and `"Return"` in addition to `"Sale" | "Adjustment" | "Payment"` — confirm all five values actually appear in your real CSV's `Type` column (or find out if there are others you haven't seen yet).

### `src/types/card.ts`
```ts
import { Transaction } from "./transaction";

interface Card {
  id: string;
  issuer: string;
  displayName: string;
  getMultiplier(transaction: Transaction): number; // card only ever answers "what's my rate?"
}

export { Card };
```

**Design note (from the hybrid approach we landed on):** `Card` no longer holds a `rewardMultipliers` lookup table — it holds a `getMultiplier` method instead. This is because real reward rules aren't always a flat category→rate mapping (e.g. Chase Sapphire Preferred gives 5x on Chase Travel specifically but only 2x on travel generally — a merchant-description distinction *within* the `"Travel"` category that a flat table can't express). Each card's `getMultiplier` is responsible only for picking the rate. It must NOT contain payment-exclusion logic, sign handling, or rounding — those are universal rules that live once in `rewards/calculateRewards.ts` (Step 5), so every card automatically inherits correct behavior instead of each card needing to reimplement (and potentially get wrong) the same arithmetic.

**No tests needed here** — pure type declarations, nothing runs at runtime to test. (If you want a sanity check, see Step 1 note in the previous conversation about deliberately writing a broken object literal to confirm `strict` catches it, then deleting it.)

**Research if stuck:** TypeScript `interface` vs `type`, `Record<K, V>` utility type.

---

## Step 2 — Card definitions

### `src/cards/chaseSapphirePreferred.ts`
```ts
import { Card } from "../types/card";
import { Transaction } from "../types/transaction";

const chaseSapphirePreferred: Card = {
  id: "csp",
  issuer: "Chase",
  displayName: "Chase Sapphire Preferred",
  getMultiplier(transaction: Transaction): number {
    if (isChaseTravel(transaction)) return 5;
    if (isDining(transaction) || isGas(transaction) || isVacationHome(transaction)) return 3;
    if (isTravel(transaction)) return 2;
    return 1;
  },
};

function isChaseTravel(transaction: Transaction): boolean {
  return transaction.description.toLowerCase().includes("chase travel"); // lowercase on BOTH sides
}

function isDining(transaction: Transaction): boolean {
  return transaction.category === "Food & drink";
}

function isGas(transaction: Transaction): boolean {
  return transaction.category === "Gas";
}

function isTravel(transaction: Transaction): boolean {
  return transaction.category === "Travel";
}

function isVacationHome(transaction: Transaction): boolean {
  return transaction.description.toLowerCase().includes("airbnb");
}

export { chaseSapphirePreferred };
```

**Note:** this file only ever answers "what's my rate for this transaction?" — no `type` checks (no `"Payment"` exclusion here), no sign math, no `Math.floor`. That all lives centrally in Step 5's `calculatePoints`, which is what makes it structurally impossible for a future card to accidentally skip the payment exclusion or get the sign backwards — there's no code path in the card file where that logic could even go.

If you want a fixed set of category strings instead of a bare `string`, define a `ChaseCategory` union type here (or in `types/`) and use it for this card's `category` comparisons — just know it's Chase-specific and a different issuer's CSV will have its own category vocabulary, so keep it out of the shared `Transaction`/`Category` types from Step 1.

### `src/cards/index.ts`
```ts
import { Card } from "../types/card";
import { chaseSapphirePreferred } from "./chaseSapphirePreferred";

const cardRegistry: Record<string, Card> = {
  csp: chaseSapphirePreferred,
};

function getCard(id: string): Card {
  // TODO: look up id in cardRegistry, throw a descriptive error if not found
}

export { getCard, cardRegistry };
```

**Why you need this file:** it's not about how each card calculates points — it's the single lookup that turns a plain string id (from a `--card csp` CLI flag, or a `cardId: "csp"` field in an API request body) into the actual `Card` object. Without it, your CLI/API would need to know how to map that string to the right imported card individually. This stays necessary regardless of the `getMultiplier` design — nothing about Step 2's redesign changes why the registry exists.

### `tests/cards/chaseSapphirePreferred.test.ts` — test cases to write:
- A Chase Travel transaction (description contains "Chase Travel", any case) returns multiplier `5`.
- A dining transaction (`category === "Food & drink"`) returns multiplier `3`.
- A gas transaction returns multiplier `3`.
- An Airbnb-description transaction returns multiplier `3` (vacation home rule).
- A general travel transaction (category `"Travel"`, not Chase Travel, not Airbnb) returns multiplier `2`.
- Everything else returns multiplier `1`.
- Case-insensitivity: `"CHASE TRAVEL"` and `"chase travel"` and `"Chase Travel Booking"` all match `isChaseTravel` — this is the test that would have caught the original `.includes("Chase Travel")` case-mismatch bug, write it deliberately.

### `tests/cards/cardRegistry.test.ts` — test cases to write:
- `getCard("csp")` returns a `Card` with `id === "csp"`.
- `getCard("nonexistent")` throws an error (not returns `undefined`).

**Research if stuck:** how to throw and test for thrown errors in your test framework (`expect(() => fn()).toThrow()` in Jest), string `.includes()` case sensitivity.

---

## Step 3 — CSV parser (naive, no validation)

### `src/parsers/chaseCsvParser.ts`
```ts
import { Transaction } from "../types/transaction";

function parseChaseCsv(csvContent: string): Transaction[] {
  // TODO:
  // 1. split csvContent into lines
  // 2. skip the header row
  // 3. split each line into columns (careful: fields may contain commas inside quotes)
  // 4. map each row to a Transaction object
  //    - convert date strings to Date objects
  //    - convert dollar-amount strings to integer cents (see cents note below)
}

export { parseChaseCsv };
```

**Cents conversion reminder:** `Math.round(Number(amountString) * 100)` — round, don't truncate, to avoid float drift landing you a cent off.

### `tests/parsers/chaseCsvParser.test.ts` — test cases to write:
- A small, known-good CSV string (2-3 rows, embedded directly in the test file as a template literal) parses into the expected number of `Transaction` objects.
- A specific row's `amountCents` matches the expected integer (e.g. `"-4.34"` → `-434`).
- Dates parse into valid `Date` objects (check `.getFullYear()`, `.getMonth()`, etc. match expectations — don't just check the type).

**Research if stuck:** CSV quoting rules (commas inside quoted fields), `Date` parsing gotchas in JS, whether to write your own line-splitter or use a small CSV parsing library (`papaparse` or `csv-parse` are common choices — worth researching whether hand-rolling is a good idea here or not).

---

## Step 4 — Zod validation at the parse boundary

### Update `src/parsers/chaseCsvParser.ts`
```ts
import { z } from "zod";

const TransactionSchema = z.object({
  transactionDate: z.coerce.date(),
  description: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(["Sale", "Adjustment", "Payment", "Fee", "Return"]),
  amountCents: z.number().int(),
});

// TODO: use TransactionSchema.parse() or .safeParse() on each row
// after your raw column-splitting, before returning Transaction[]
```

Decide: should `parseChaseCsv` throw on the first bad row, or collect all errors and report them together? Both are legitimate; know which one you're choosing and why.

### `tests/parsers/chaseCsvParser.test.ts` — additional test cases:
- A row with a missing `amountCents` throws (or is collected as an error, depending on your design).
- A row with an invalid `type` value (not one of the five valid values) is rejected.
- A row with a malformed date is rejected.
- A fully valid row still passes (regression check that validation isn't overly strict).

**Research if stuck:** `zod` docs on `.parse()` vs `.safeParse()`, `z.coerce`, `ZodError` structure.

---

## Step 5 — Rewards calculator (universal rules; card only supplies the rate)

### `src/rewards/calculateRewards.ts`
```ts
import { Transaction } from "../types/transaction";
import { Card } from "../types/card";

function calculatePoints(transaction: Transaction, card: Card): number {
  // TODO:
  // 1. "Payment" is always excluded — return 0 (paying your bill isn't a purchase)
  // 2. everything else ("Sale", "Fee", "Adjustment", "Return") uses the SAME sign rule
  //    as calculateStatementBalance:
  //      - negative amountCents = a charge → earns points (positive)
  //      - positive amountCents = a credit/refund → removes points (negative)
  //    so a "Sale" and a credit "Adjustment" use the identical formula, just opposite
  //    sign, because it's the sign of amountCents driving it, not the type itself
  // 3. multiplier = card.getMultiplier(transaction)  — the card ONLY tells you the rate,
  //    it has no say in payment-exclusion, sign, or rounding (see Step 2 note)
  // 4. dollars = Math.abs(transaction.amountCents) / 100
  // 5. magnitude = Math.floor(dollars * multiplier)
  // 6. return amountCents < 0 ? magnitude : -magnitude   (i.e. sign follows amountCents' sign, inverted)
}

function calculateTotalPoints(transactions: Transaction[], card: Card): number {
  // TODO: sum calculatePoints() across all transactions
}

export { calculatePoints, calculateTotalPoints };
```

### `tests/rewards/calculateRewards.test.ts` — test cases to write:

Use a **minimal fake `Card`** for these tests (e.g. `{ id: "test", issuer: "Test", displayName: "Test Card", getMultiplier: () => 3 }`), not the real `chaseSapphirePreferred`. That isolates "does the universal payment/sign/rounding logic work" from "does this specific card's rate-picking logic work" (which belongs in `tests/cards/chaseSapphirePreferred.test.ts` instead, per Step 2).

- A `"Sale"` transaction returns the correct (positive) points using the fake card's fixed multiplier.
- A `"Fee"` transaction earns points the same way a `"Sale"` does (per your rule: it's still a charge).
- A `"Return"` transaction returns negative points — same magnitude as the equivalent `"Sale"` would earn, just negated.
- An `"Adjustment"` transaction also follows the sign rule — test both a charge-shaped adjustment (negative `amountCents`, positive points) and a credit-shaped one (positive `amountCents`, negative points, shaped like Chase's real `KNOWN TRAVELER CREDIT` row).
- A `"Payment"` transaction returns `0` regardless of category/amount/multiplier.
- `calculateTotalPoints` on an empty array returns `0`.
- A regression test using real numbers from one of your actual statements, once `chaseSapphirePreferred.getMultiplier` is fully implemented and tested (Step 2).

**Research if stuck:** why isolating "universal logic" tests from "card-specific logic" tests with a fake/stub object is a common testing pattern (search: "test doubles," "fakes vs mocks"), `Math.floor` vs `Math.round` semantics.

---

## Step 6 — Statement balance calculator

### `src/audit/calculateBalance.ts`
```ts
import { Transaction } from "../types/transaction";

function calculateStatementBalance(transactions: Transaction[]): number {
  // TODO: balance = sum of (-amountCents) for every transaction
  // i.e. a negative amountCents ADDS to the balance, a positive amountCents SUBTRACTS from it
  // (confirm this sign convention against a real row from your actual CSV before trusting it)
}

export { calculateStatementBalance };
```

### `tests/audit/calculateBalance.test.ts` — test cases to write:
- A transaction with a negative `amountCents` increases the returned balance.
- A transaction with a positive `amountCents` decreases the returned balance.
- Known transaction list sums to the expected total, given the sign rule above.
- Empty array returns `0`.

**Research if stuck:** `Array.prototype.reduce` signature and initial-value argument.

---

## Step 7 — `auditStatement` (the core function everything wraps)

**Design change from earlier:** Chase doesn't expose per-transaction points, so your program can't say "*this specific transaction* is wrong" — only "the totals don't match, here's every transaction's contribution so a human can reconcile manually." So instead of a `mismatches` list that only appears on failure, every transaction gets a detail line, always, and the human does the reconciling.

### `src/audit/auditStatement.ts`
```ts
import { Transaction } from "../types/transaction";
import { Card } from "../types/card";
import { calculateStatementBalance } from "./calculateBalance";
import { calculatePoints, calculateTotalPoints } from "../rewards/calculateRewards";

interface TransactionPointDetail {
  description: string;   // TODO: include amount and type in the string, e.g.
                          // `"${description} (${type}, $${dollars}) — expected ${points} pts"`
  amountCents: number;
  type: Transaction["type"];
  category: string;
  expectedPoints: number;
}

interface AuditResult {
  calculatedBalanceCents: number;
  statementBalanceCents: number;
  balanceMatches: boolean;
  calculatedPoints: number;
  statementPoints: number;
  pointsMatch: boolean;
  transactionDetails: TransactionPointDetail[];
}

interface AuditInput {
  transactions: Transaction[];
  card: Card;
  statementBalanceCents: number;
  statementPoints: number;
}

function auditStatement(input: AuditInput): AuditResult {
  // TODO:
  // 1. calculate balance, compare to input.statementBalanceCents
  // 2. calculate total points, compare to input.statementPoints
  // 3. build transactionDetails: one entry per transaction, always populated
  //    (not conditional on pointsMatch — the user needs this list to do their own reconciling
  //    whether or not there's a discrepancy)
}

export { auditStatement, AuditResult, AuditInput, TransactionPointDetail };
```

### `tests/audit/auditStatement.test.ts` — test cases to write:
- Everything matches: `balanceMatches` and `pointsMatch` both `true`, `transactionDetails` still has one entry per input transaction (not empty — it's always populated now).
- Balance mismatch only: `balanceMatches: false`, `pointsMatch: true`.
- Points mismatch: `pointsMatch: false`, and every transaction's expected points appear correctly in `transactionDetails` regardless of match status.
- `transactionDetails[i].description` string actually includes the amount and type — write an assertion checking the string contains the expected dollar figure and type, not just that the field exists.

**Research if stuck:** template literals for building formatted strings, designing a return type that's useful to multiple consumers (CLI text output vs. API JSON — both need this list, just formatted differently).

---

## Step 8 — CLI

### `src/cli/index.ts`
```ts
// TODO:
// 1. parse command-line args (--csv path, --card id, --balance dollars, --points number)
// 2. read the CSV file from disk (Node's `fs` module)
// 3. call parseChaseCsv, getCard, auditStatement
// 4. print a human-readable report to the console
```

### `tests/cli/index.test.ts` — test cases to write:
- Running the CLI's main function with a known fixture CSV and matching balance/points produces output containing "match" language (or whatever your success indicator is).
- Running it with mismatched values produces output flagging the mismatch.

**Research if stuck:** Node's `process.argv`, `fs.readFileSync`, whether to hand-roll arg parsing or use a small library (`commander` or `yargs` are common — decide if that's worth adding here or if hand-rolling 4 flags is simple enough).

---

## Step 9 — API

### `src/api/server.ts`
```ts
import express from "express";
import { z } from "zod";
// TODO: import auditStatement, getCard, your Transaction schema, etc.

const app = express();
app.use(express.json());

const AuditRequestSchema = z.object({
  // TODO: mirror your Transaction validation, plus cardId, statementBalanceCents, statementPoints
});

app.post("/audit", (req, res) => {
  // TODO:
  // 1. validate req.body with AuditRequestSchema, return 400 on failure
  // 2. resolve the card via getCard(cardId)
  // 3. call auditStatement
  // 4. return 200 with the AuditResult as JSON
});

// TODO: error-handling middleware — catch unexpected throws, return 500

export { app };
```

### `tests/api/server.test.ts` — test cases to write (use `supertest`):
- `POST /audit` with a valid payload returns `200` and a correctly-shaped `AuditResult`.
- `POST /audit` with a malformed body (missing fields, wrong types) returns `400`.
- `POST /audit` with an unknown `cardId` — decide and test: `400` or `404`?
- Something that triggers an unexpected server-side error returns `500`, not a crash.

**Research if stuck:** `express.json()` middleware, `supertest` usage patterns, Express error-handling middleware signature (`(err, req, res, next)` — note the 4 params, that's what makes Express treat it as an error handler).

---

## Step 10 (optional) — second card, to prove generalization actually works

Add `src/cards/[someOtherCard].ts`, register it in `cards/index.ts`, and — critically — **do not touch anything in `rewards/`, `audit/`, `cli/`, or `api/`.** If adding a second card requires changing any of those files, the generalization from our design conversation didn't actually work and is worth revisiting.

---

## Suggested order to actually build in

Steps 1 → 2 → 3 → 4 → 5 → 6 → 7 are your core logic and should each be fully tested and working before you move to the next. Steps 8 and 9 (CLI, API) are thin wrappers around Step 7 — build whichever one you want more practice with first. Step 10 is a good "did I actually design this right" checkpoint once everything else works.