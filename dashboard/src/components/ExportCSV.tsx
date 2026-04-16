"use client";

import { Download } from "lucide-react";
import { JournalEntry } from "../types/journal";

type Props = {
    data: JournalEntry[];
};

export function ExportCSV({ data }: Props) {
    const handleExport = () => {
        // Exact header required by the prompt
        const headers = "発生日, 借方勘定科目, 借方金額, 貸方勘定科目, 貸方金額, 備考, 取引先";

        // Convert data to CSV rows
        const rows = data.map((entry) => {
            // Escape quotes and wrap text in quotes if it contains commas
            const escapeCsv = (str: string | number) => {
                const stringVal = String(str);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            };

            return [
                escapeCsv(entry.Date),
                escapeCsv(entry.Debit_Account),
                escapeCsv(entry.Debit_Amount),
                escapeCsv(entry.Credit_Account),
                escapeCsv(entry.Credit_Amount),
                escapeCsv(entry.Description),
                escapeCsv(entry.Client)
            ].join(", ");
        });

        const csvContent = [headers, ...rows].join("\n");
        // Add BOM for Excel UTF-8 compatibility
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `freee_journal_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Download className="mr-2 h-4 w-4" />
            Export freee CSV
        </button>
    );
}
