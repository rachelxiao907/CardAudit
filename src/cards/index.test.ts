import { test } from "node:test";
import { ok, throws } from "node:assert/strict";
import { getCard } from "./index";

// npm install -D tsx
// node --import=tsx --test src/cards/index.test.ts

test("getCard returns CSP", () => {
    const card = getCard("csp");

    ok(card);
});

test("getCard throws for unknown card", () => {
    throws(() => {
        getCard("amex");
    });
});