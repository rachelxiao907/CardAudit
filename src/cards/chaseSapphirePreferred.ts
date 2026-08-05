import { Card } from "../types/card"
import { Transaction } from "../types/transaction"

// https://www.chase.com/sapphire-cards/personal/preferred

const chaseSapphirePreferred: Card = {
    id: "csp",
    displayName: "Chase Sapphire Preferred",
    calculatePoints(transaction: Transaction): number {
        if (isChaseTravel(transaction)) {
            return 5 * (transaction.amountCents / 100);
        } else if (isDining(transaction) || isGas(transaction) || isVacationHome(transaction) ) {
            return 3 * (transaction.amountCents / 100);
        } else if (isTravel(transaction)) {
            return 2 * (transaction.amountCents / 100);
        }
        return transaction.amountCents / 100;
    } 
} 

function isChaseTravel(transaction: Transaction): boolean {
    return transaction.description.toLowerCase().includes("Chase Travel");
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
    return transaction.description.toLowerCase().includes("AIRBNB");
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
  | "Travel"
  | "Miscellaneous"
  | "Personal"
  | "Professional services"
  | "Shopping"
  | "Travel";

export type { ChaseCategory };