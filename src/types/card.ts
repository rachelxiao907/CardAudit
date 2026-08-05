import { Transaction } from "./transaction";

interface Card {
    id: string;
    displayName: string;
    calculatePoints(transaction: Transaction): number;
}

export type { Card };