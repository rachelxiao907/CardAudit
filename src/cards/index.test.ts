import { test } from "node:test";
import { equal, ok, throws } from "node:assert/strict";
import { getCard } from "./index";

// npm install -D tsx
// node --import=tsx --test src/cards/index.test.ts
// node --import=tsx --test "src/**/*.test.ts"

test("getCard returns CSP", () => {
    const card = getCard("csp");
    ok(card);
    equal(card.id, "csp");
});

test("getCard throws for unknown card", () => {
    throws(() => {
        getCard("amex");
    });
});