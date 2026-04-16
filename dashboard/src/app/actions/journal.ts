"use server";

import { google } from "googleapis";
import { JournalEntry } from "@/types/journal";
import { revalidatePath } from "next/cache";

export async function appendJournalEntries(entries: JournalEntry[]) {
    try {
        // Need write access scope
        const target = ["https://www.googleapis.com/auth/spreadsheets"];
        const jwt = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: target
        });

        const sheets = google.sheets({ version: "v4", auth: jwt });

        // Format strictly for Journal sheet: Date, Debit_Item, Debit_Amount, Credit_Item, Credit_Amount, Description, Client_Name
        const values = entries.map(e => [
            e.Date,
            e.Debit_Account,
            e.Debit_Amount,
            e.Credit_Account,
            e.Credit_Amount,
            e.Description,
            e.Client
        ]);

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: "Journal!A:G",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values,
            },
        });

        // Revalidate the home page so the new data appears instantly upon modal close
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Error appending to sheets:", error);
        return { success: false, error: error.message || "Failed to append entries" };
    }
}
