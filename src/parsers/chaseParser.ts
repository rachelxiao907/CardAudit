import { Transaction } from "../types/transaction";
import { z } from "zod";

// TODO: zod validation
const TransactionSchema = z.object({
    transactionDate: z.coerce.date(), // automatically cast raw data into Date and validates it
    description: z.string().min(1),
    category: z.string().min(1), // TODO: ChaseCategory enum validation
    type: z.string().min(1), // TODO: TransactionType enum validation
    amountCents: z.number().int(), // number() is a base validator and int() is a modifier
});

function parseChaseCsv(csvContent: string): Transaction[] {
    const lines = csvContent.split("\n");
    const [headerLine, ...dataLines] = lines // skip the header row by matching the array shapes

    if (headerLine === undefined) {
        throw new Error("CSV is empty — no header row found");
    }

    // Figure out column index by name
    const headers = headerLine.split(",").map(h => h.trim());
    const dateIndex = headers.indexOf("Transaction Date");
    const descriptionIndex = headers.indexOf("Description");
    const categoryIndex = headers.indexOf("Category");
    const typeIndex = headers.indexOf("Type");
    const amountIndex = headers.indexOf("Amount");

    // console.log({ dateIndex, descriptionIndex, categoryIndex, typeIndex, amountIndex });

    // Parse transactions
    const transactions: Transaction[] = [];
    for (const line of dataLines) {
        if (line.trim() === "") continue; // skip blank lines, trailing newline, etc.
        const fields = line.split(",");

        const rawDate = requireField(fields[dateIndex], "Transaction Date", line);
        const rawDescription = requireField(fields[descriptionIndex], "Description", line);
        const rawCategory = requireField(fields[categoryIndex], "Category", line);
        const rawType = requireField(fields[typeIndex], "Type", line);
        const rawAmount = requireField(fields[amountIndex], "Amount", line);

        const transactionDate = new Date(rawDate);
        const amountCents = Math.round(Number(rawAmount) * 100);

        const transaction: Transaction = {
            transactionDate,
            description: rawDescription.trim(),
            category: rawCategory.trim() as Transaction["category"], // TODO: replace with Zod validation
            type: rawType.trim() as Transaction["type"], // TODO: replace with Zod validation
            amountCents
        }
        transactions.push(transaction);
    }

    return transactions;
}

// Helper function for extracting fields
function requireField(value: string | undefined, fieldName: string, line: string): string { 
    if (value == undefined) {
        throw new Error(`Row is missing "${fieldName}": ${line}`);
    }
    return value;
}

export { parseChaseCsv }; 


// ALTERNATIVE TO HAND-ROLLED SPLIT

// npm install csv-parse
// import { parse } from "csv-parse/sync";
// import { Transaction } from "../types/transaction";

// function parseChaseCsv(csvContent: string): Transaction[] {
//   const records: Record<string, string>[] = parse(csvContent, {
//     columns: true,      // use the header row to produce objects keyed by column name
//     trim: true,         // trims whitespace from every field automatically
//   });

//   return records.map(record => ({
//     transactionDate: new Date(record["Transaction Date"]),
//     description: record["Description"],
//     category: record["Category"],
//     type: record["Type"] as Transaction["type"],
//     amountCents: Math.round(Number(record["Amount"]) * 100),
//   }));
// }

// export { parseChaseCsv };