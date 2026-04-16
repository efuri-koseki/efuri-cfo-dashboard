import { google } from "googleapis";
import { JournalEntry } from "../types/journal";

export async function getJournalData(spreadsheetId: string): Promise<JournalEntry[]> {
    try {
        const target = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
        const jwt = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: target
        });

        const sheets = google.sheets({ version: "v4", auth: jwt });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: "Journal!A:G", // Expected columns: Date, Debit_Item, Debit_Amount, Credit_Item, Credit_Amount, Description, Client_Name
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.warn("No data found in spreadsheet.");
            return [];
        }

        // First row is the header, skip it
        const entries: JournalEntry[] = [];

        // We expect header order: Date, Debit_Item, Debit_Amount, Credit_Item, Credit_Amount, Description, Client_Name
        // We will map by index, assuming the structure is strictly followed.
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            // Skip empty rows
            if (!row || row.length === 0 || !row[0]) continue;

            // Helper to clean currency strings (e.g. "¥61,160" -> "61160")
            const cleanAmount = (val: string) => {
                if (!val) return 0;
                // Remove anything that is not a digit or minus sign
                const cleaned = val.replace(/[^\d-]/g, '');
                return Number(cleaned) || 0;
            };

            entries.push({
                id: `row-${i + 1}`, // Use row number as unique ID
                Date: row[0] || "",
                Debit_Account: row[1] || "",
                Debit_Amount: cleanAmount(row[2]),
                Credit_Account: row[3] || "",
                Credit_Amount: cleanAmount(row[4]),
                Description: row[5] || "",
                Client: row[6] || "",
            });
        }

        return entries;
    } catch (error) {
        console.error("Error fetching data from Google Sheets:", error);
        // You could return [] or throw the error depending on your error boundary setup
        return [];
    }
}
