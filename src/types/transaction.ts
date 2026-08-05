type Category =
  | "Food & Drink"
  | "Travel"
  | "Groceries"
  | "Entertainment"
  | "Bills & Utilities"
  | "Shopping"
  | "Fees & Adjustments";
type TransactionType = "Sale" | "Adjustment" | "Payment" | "Fee" | "Return";

interface Transaction {
    transactionDate: Date;
    description: string;
    category: Category;
    type: TransactionType;
    amountCents: number;
}

export type { Transaction, Category };

// src/types/transaction.ts:14:7 - error TS2739: Type '{}' is missing the following properties from type 'Transaction': transactionDate, description, category, type, amountCents
// const bad: Transaction = {};