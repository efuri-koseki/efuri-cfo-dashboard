import { JournalEntry } from "../types/journal";

// Helper to generate some random plausible data
const generateMockData = (): JournalEntry[] => {
    const data: JournalEntry[] = [];
    const startYear = 2023; // Sep 2023 to Aug 2024

    const clients = ["株式会社A", "合同会社B", "株式会社C", "フリーランスD"];
    const expenses = ["仕入高", "役員報酬", "広告宣伝費", "交際費", "通信費", "地代家賃"];
    let idCounter = 1;

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
        // 0 = Sep, 11 = Aug
        const targetMonth = (9 + monthOffset - 1) % 12 + 1;
        const targetYear = startYear + Math.floor((8 + monthOffset) / 12);
        const monthStr = targetMonth.toString().padStart(2, '0');

        // Generate Sales (売上高)
        data.push({
            id: `J-${idCounter++}`,
            Date: `${targetYear}-${monthStr}-15`,
            Debit_Account: "普通預金",
            Debit_Amount: 4000000 + Math.floor(Math.random() * 2000000), // 4M - 6M
            Credit_Account: "売上高",
            Credit_Amount: 4000000 + Math.floor(Math.random() * 2000000), // Same logic roughly
            Description: "〇〇システム開発費",
            Client: clients[Math.floor(Math.random() * clients.length)]
        });

        // Generate specific Expenses
        expenses.forEach(exp => {
            const amount = exp === "役員報酬" ? 500000 : 50000 + Math.floor(Math.random() * 200000);
            data.push({
                id: `J-${idCounter++}`,
                Date: `${targetYear}-${monthStr}-25`,
                Debit_Account: exp,
                Debit_Amount: amount,
                Credit_Account: "普通預金",
                Credit_Amount: amount,
                Description: `${exp}の支払い`,
                Client: "各種取引先"
            });
        });

        // Generate specific Liabilities (未払金, 未払金（AMEX）, 借入金) - these might not hit PL directly but are recorded
        data.push({
            id: `J-${idCounter++}`,
            Date: `${targetYear}-${monthStr}-10`,
            Debit_Account: "消耗品費",
            Debit_Amount: 30000,
            Credit_Account: "未払金（AMEX）",
            Credit_Amount: 30000,
            Description: "事務用品カード払い",
            Client: "Amazon"
        });

        // Pay off some AMEX
        data.push({
            id: `J-${idCounter++}`,
            Date: `${targetYear}-${monthStr}-27`,
            Debit_Account: "未払金（AMEX）",
            Debit_Amount: 15000,
            Credit_Account: "普通預金",
            Credit_Amount: 15000,
            Description: "カード引き落とし",
            Client: "AMEX"
        });

        // Borrowing/Repayment
        if (monthOffset === 0) {
            data.push({
                id: `J-${idCounter++}`,
                Date: `${targetYear}-${monthStr}-01`,
                Debit_Account: "普通預金",
                Debit_Amount: 5000000,
                Credit_Account: "借入金",
                Credit_Amount: 5000000,
                Description: "創業融資",
                Client: "日本政策金融公庫"
            });
        } else {
            data.push({
                id: `J-${idCounter++}`,
                Date: `${targetYear}-${monthStr}-20`,
                Debit_Account: "借入金",
                Debit_Amount: 100000,
                Credit_Account: "普通預金",
                Credit_Amount: 100000,
                Description: "融資返済",
                Client: "日本政策金融公庫"
            });
        }
    }

    return data;
};

export const mockJournalData: JournalEntry[] = generateMockData();
