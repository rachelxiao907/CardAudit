/**
 * Single lookup that turns a plain string id from a CLI flag or API request body into a actual Card object
 */

import { Card } from "../types/card";
import { chaseSapphirePreferred } from "./chaseSapphirePreferred";

const cardRegistry: Record<string, Card> = {
    csp: chaseSapphirePreferred,
};

function getCard(id: string): Card {
    const card = cardRegistry[id];
    if (!card) {
        throw new Error(`Unknown card ID: ${id}`);
    }
    return card;
}


// TESTING 

// npx tsx src/cards/index.ts
// console.log(getCard('csp'));
// console.log(getCard('amex'));

export { getCard };


// JEST 

// expect(() => functionThatThrows()).toThrow();

// import { getCard } from "./cardRegistry";

// describe("getCard", () => {
//     it("returns the card when the ID exists", () => {
//         const card = getCard("csp");

//         expect(card).toBeDefined();
//     });

//     it("throws an error when the ID does not exist", () => {
//         expect(() => getCard("amex")).toThrow();
//     });
// });


// Don't do this:

// expect(getCard("amex")).toThrow();

// That's because getCard("amex") executes before Jest's expect() gets control.

// Instead, wrap the function in another function:

// expect(() => getCard("amex")).toThrow();