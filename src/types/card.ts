import { Transaction } from "./transaction";

interface Card {
    id: string;
    displayName: string;
    getMultiplier(transaction: Transaction): number;
}

export type { Card };