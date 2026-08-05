import { Category } from "./transaction";

interface Card {
    id: string;
    displayName: string;
    rewardMultipliers: Record<Category, number>;
}

export type { Card };