import { test } from "node:test";
import { equal } from "node:assert/strict";
import { chaseSapphirePreferred } from "./chaseSapphirePreferred";
import { Transaction } from "../types/transaction";

// npm install -D tsx
// node --import=tsx --test src/cards/chaseSapphirePreferred.test.ts

// Helper so each test only specifies what it's varying, not all 5 fields every time.
function makeTransaction(overrides: Partial<Transaction>): Transaction {
    return  {
        transactionDate: new Date("2026-08-01"),
        description: "SOME MERCHANT",
        category: "Shopping",
        type: "Sale",
        amountCents: -1000,
        ...overrides, 
        // later keys win when there is a duplicate
    };
}

test("Chase Travel transaction returns 5x", () => {
    const transaction = makeTransaction({ description: "Chase Travel Booking 12345 "});
    const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
    equal(multiplier, 5);
});

test("Dining returns 3x", () => {
    const transaction = makeTransaction({ category: "Food & drink"});
    const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
    equal(multiplier, 3);
});

test("Gas returns 3x", () => {
    const transaction = makeTransaction({ category: "Gas"});
    const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
    equal(multiplier, 3);
});

test("Airbnb transaction returns 3x", () => {
    const transaction = makeTransaction({ description: "AIRBNB * HMN8NDAQXM"});
    const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
    equal(multiplier, 3);
});

test("general travel (not Chase Travel, not Airbnb) returns 2x", () => {
    const transaction = makeTransaction({ category: "Travel"});
    const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
    equal(multiplier, 2);
});

test("everything else returns 1x", () => {
  const transaction = makeTransaction({});
  const multiplier = chaseSapphirePreferred.getMultiplier(transaction);
  equal(multiplier, 1);
});