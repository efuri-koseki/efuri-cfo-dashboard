import { JournalEntry, EXPENSE_ACCOUNTS, LIABILITY_ACCOUNTS, REVENUE_ACCOUNT } from "../types/journal";

export const MONTHS_ORDER = ["09", "10", "11", "12", "01", "02", "03", "04", "05", "06", "07", "08"];

export type MonthlyData = {
    month: string; // "MM"
    sales: number;
    expenses: Record<string, number>;
    totalExpenses: number;
    operatingProfit: number;
    liabilities: Record<string, number>; // cumulative balance
};

export type FinancialSummary = {
    monthly: MonthlyData[];
    yearly: Omit<MonthlyData, "month" | "liabilities"> & { liabilities: Record<string, number> };
    currentCashBalance: number;
};

export const calculateFinancials = (entries: JournalEntry[]): FinancialSummary => {
    // Initialize data structure
    const monthlyData: Record<string, MonthlyData> = {};
    MONTHS_ORDER.forEach(m => {
        monthlyData[m] = {
            month: m,
            sales: 0,
            expenses: Object.fromEntries(EXPENSE_ACCOUNTS.map(e => [e, 0])),
            totalExpenses: 0,
            operatingProfit: 0,
            liabilities: Object.fromEntries(LIABILITY_ACCOUNTS.map(l => [l, 0]))
        };
    });

    const yearly = {
        sales: 0,
        expenses: Object.fromEntries(EXPENSE_ACCOUNTS.map(e => [e, 0])),
        totalExpenses: 0,
        operatingProfit: 0,
        liabilities: Object.fromEntries(LIABILITY_ACCOUNTS.map(l => [l, 0]))
    };

    let currentCashBalance = 0;

    // Regex helper: Remove auxiliary names in brackets like "未払金（AMEX）" -> "未払金"
    const normalizeAccount = (account: string) => {
        if (!account) return "";
        return account.replace(/（.*?）|\(.*?\)/g, "").trim();
    };

    // Temporary object to track liability balances across time sorting
    // Assumes entries are somewhat ordered, but we better sort them by date first.
    // Also apply account normalization here so all downstream calculations get the clean grouped keys.
    const sortedEntries = [...entries]
        .map(entry => ({
            ...entry,
            Debit_Account: normalizeAccount(entry.Debit_Account),
            Credit_Account: normalizeAccount(entry.Credit_Account),
        }))
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    // Track cumulative liability balances independent of month
    const liabilityBalances: Record<string, number> = Object.fromEntries(LIABILITY_ACCOUNTS.map(l => [l, 0]));

    sortedEntries.forEach(entry => {
        const month = entry.Date.split("-")[1];

        // Only process if month is within our tracked months (it should be)
        if (!monthlyData[month]) return;

        const mData = monthlyData[month];

        // --- Cash Balance ---
        if (entry.Debit_Account === "現金" || entry.Debit_Account === "普通預金" || entry.Debit_Account === "当座預金") {
            currentCashBalance += entry.Debit_Amount;
        }
        if (entry.Credit_Account === "現金" || entry.Credit_Account === "普通預金" || entry.Credit_Account === "当座預金") {
            currentCashBalance -= entry.Credit_Amount;
        }

        // --- Sales (売上高) ---
        // Revenue is typically credited. 
        if (entry.Credit_Account === REVENUE_ACCOUNT) {
            mData.sales += entry.Credit_Amount;
            yearly.sales += entry.Credit_Amount;
        }
        // Handle refunds (debit revenue)
        if (entry.Debit_Account === REVENUE_ACCOUNT) {
            mData.sales -= entry.Debit_Amount;
            yearly.sales -= entry.Debit_Amount;
        }

        // --- Expenses ---
        if (EXPENSE_ACCOUNTS.includes(entry.Debit_Account)) {
            mData.expenses[entry.Debit_Account] += entry.Debit_Amount;
            mData.totalExpenses += entry.Debit_Amount;

            yearly.expenses[entry.Debit_Account] += entry.Debit_Amount;
            yearly.totalExpenses += entry.Debit_Amount;
        }
        // Expense refunds
        if (EXPENSE_ACCOUNTS.includes(entry.Credit_Account)) {
            mData.expenses[entry.Credit_Account] -= entry.Credit_Amount;
            mData.totalExpenses -= entry.Credit_Amount;

            yearly.expenses[entry.Credit_Account] -= entry.Credit_Amount;
            yearly.totalExpenses -= entry.Credit_Amount;
        }

        // --- Liabilities (Specific) ---
        // Liabilities increase with Credit, decrease with Debit
        if (LIABILITY_ACCOUNTS.includes(entry.Credit_Account)) {
            liabilityBalances[entry.Credit_Account] += entry.Credit_Amount;
        }
        if (LIABILITY_ACCOUNTS.includes(entry.Debit_Account)) {
            liabilityBalances[entry.Debit_Account] -= entry.Debit_Amount;
        }

        // We can't just set the month's balance here because multiple entries in a month or months with NO entries.
        // We will do a second pass to set the end-of-month liability balance.
    });

    // Calculate Operating Profit (営業利益 = 収益 - 費用)
    MONTHS_ORDER.forEach(m => {
        monthlyData[m].operatingProfit = monthlyData[m].sales - monthlyData[m].totalExpenses;
    });
    yearly.operatingProfit = yearly.sales - yearly.totalExpenses;

    // Second pass for Liabilities: we need the closing balance of each month.
    // Re-run sequentially by month order.
    const tempLiabilities = Object.fromEntries(LIABILITY_ACCOUNTS.map(l => [l, 0]));

    // Group entries by month for balance calculation
    const entriesByMonth: Record<string, JournalEntry[]> = {};
    MONTHS_ORDER.forEach(m => { entriesByMonth[m] = []; });

    sortedEntries.forEach(entry => {
        const m = entry.Date.split("-")[1];
        if (entriesByMonth[m]) entriesByMonth[m].push(entry);
    });

    MONTHS_ORDER.forEach(m => {
        const mEntries = entriesByMonth[m];
        mEntries.forEach(entry => {
            if (LIABILITY_ACCOUNTS.includes(entry.Credit_Account)) {
                tempLiabilities[entry.Credit_Account] += entry.Credit_Amount;
            }
            if (LIABILITY_ACCOUNTS.includes(entry.Debit_Account)) {
                tempLiabilities[entry.Debit_Account] -= entry.Debit_Amount;
            }
        });
        // Set End-of-Month balance
        monthlyData[m].liabilities = { ...tempLiabilities };
    });

    // Set final yearly liabilities (as of end of year)
    yearly.liabilities = { ...tempLiabilities };

    return {
        monthly: MONTHS_ORDER.map(m => monthlyData[m]),
        yearly,
        currentCashBalance
    };
};
