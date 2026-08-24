import { Card } from "../types/card"
import { Transaction } from "../types/transaction"

// https://www.chase.com/sapphire-cards/personal/preferred

const chaseSapphirePreferred: Card = {
    id: "csp",
    displayName: "Chase Sapphire Preferred",
    getMultiplier(transaction: Transaction): number {
        if (isChaseTravel(transaction)) return 5;
        if (isDining(transaction) || isGas(transaction) || isVacationHome(transaction)) return 3;
        if (isTravel(transaction)) return 2;
        return 1;
    } 
} 

function isChaseTravel(transaction: Transaction): boolean {
    return transaction.description.toLowerCase().includes("chase travel");
}

function isDining(transaction: Transaction): boolean {
    return transaction.category === "Food & drink";
}

function isGas(transaction: Transaction): boolean {
    return transaction.category === "Gas";
}

function isTravel(transaction: Transaction): boolean {
    // === checks value and type of the strings which makes it safe to compare
    return transaction.category === "Travel";
}

function isVacationHome(transaction: Transaction): boolean {
    return transaction.description.toLowerCase().includes("airbnb");
}

type ChaseCategory =
  | "Automotive"
  | "Bills & utilities"
  | "Education"
  | "Entertainment"
  | "Fees & adjustments"
  | "Food & drink"
  | "Gas"
  | "Gifts & donations"
  | "Groceries"
  | "Health & wellness"
  | "Home"
  | "Miscellaneous"
  | "Personal"
  | "Professional services"
  | "Shopping"
  | "Travel";

// const chaseCategories = [
//     "Automotive", "Bills & utilities", "Education", "Entertainment",
//     "Fees & adjustments", "Food & drink", "Gas", "Gifts & donations",
//     "Groceries", "Health & wellness", "Home", "Miscellaneous",
//     "Personal", "Professional services", "Shopping", "Travel",
// ] as const; // `as const` is essential — without it, TS widens this to string[]
// type ChaseCategory = (typeof chaseCategories)[number];

// export type exports the declarations and not the value/object
export { chaseSapphirePreferred };
export type { ChaseCategory };