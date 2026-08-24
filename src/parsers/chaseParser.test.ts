import { test } from "node:test";
import { equal, ok } from "node:assert/strict";
import { parseChaseCsv } from "./chaseParser";

// npm install -D tsx
// node --import=tsx --test src/parsers/chaseCsvParser.test.ts

const sampleCsv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
07/31/2026,08/02/2026,HEYTEA-Herald Square,Food & Drink,Sale,-4.34,
07/27/2026,07/28/2026,KNOWN TRAVELER CREDIT,Fees & Adjustments,Adjustment,76.75,
08/01/2026,08/02/2026,MTA*LIRR ETIX TICKET,Travel,Sale,-5.25,`;

test("parses the correct number of transactions", () => {
  const result = parseChaseCsv(sampleCsv);
  equal(result.length, 3);
});

test("parses a negative amount into negative cents", () => {
  const result = parseChaseCsv(sampleCsv);
  const first = result[0];
  ok(first); // narrows `first` from Transaction | undefined to Transaction

  equal(first.amountCents, -434); // "-4.34" -> -434
});

test("parses a positive amount into positive cents", () => {
  const result = parseChaseCsv(sampleCsv);
  const second = result[1];
  ok(second);

  equal(second.amountCents, 7675); // "76.75" -> 7675
});

test("parses the transaction date correctly", () => {
  const result = parseChaseCsv(sampleCsv);
  const first = result[0];
  ok(first);

  equal(first.transactionDate.getFullYear(), 2026);
  equal(first.transactionDate.getMonth(), 6); // July is index 6 — Date months are 0-indexed!
  equal(first.transactionDate.getDate(), 31);
});

test("parses description, category, and type correctly", () => {
  const result = parseChaseCsv(sampleCsv);
  const third = result[2];
  ok(third);

  equal(third.description, "MTA*LIRR ETIX TICKET");
  equal(third.category, "Travel");
  equal(third.type, "Sale");
});