"use client";

import { Download } from "lucide-react";
import { JournalEntry } from "../types/journal";

type Props = {
    data: JournalEntry[];
};

export function ExportMFCsv({ data }: Props) {
    const handleExport = () => {
        const headers = "取引No,取引日,借方勘定科目,借方補助科目,借方部門,借方取引先,借方税区分,借方インボイス,借方金額(円),借方税額,貸方勘定科目,貸方補助科目,貸方部門,貸方取引先,貸方税区分,貸方インボイス,貸方金額(円),貸方税額,摘要";

        const rows = data.map((entry) => {
            const escapeCsv = (str: string | number | undefined) => {
                if (str === undefined || str === null) return "";
                const stringVal = String(str);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            };

            const taxType = ""; // User mentioned Tax_Type but it's not present in sheet column A-G, leaving empty

            return [
                escapeCsv(""), // 取引No
                escapeCsv(entry.Date), // 取引日
                escapeCsv(entry.Debit_Account), // 借方勘定科目
                escapeCsv(""), // 借方補助科目
                escapeCsv(""), // 借方部門
                escapeCsv(""), // 借方取引先
                escapeCsv(taxType), // 借方税区分
                escapeCsv(""), // 借方インボイス
                escapeCsv(entry.Debit_Amount), // 借方金額(円)
                escapeCsv(""), // 借方税額
                escapeCsv(entry.Credit_Account), // 貸方勘定科目
                escapeCsv(""), // 貸方補助科目
                escapeCsv(""), // 貸方部門
                escapeCsv(""), // 貸方取引先
                escapeCsv(taxType), // 貸方税区分
                escapeCsv(""), // 貸方インボイス
                escapeCsv(entry.Credit_Amount), // 貸方金額(円)
                escapeCsv(""), // 貸方税額
                escapeCsv(entry.Description)  // 摘要
            ].join(",");
        });

        const csvContent = [headers, ...rows].join("\n");
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mf_journal_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Download className="mr-2 h-4 w-4" />
            Export MF CSV
        </button>
    );
}
