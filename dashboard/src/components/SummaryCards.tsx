import { FinancialSummary } from "../lib/calculations";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { cn } from "../lib/utils";

type Props = {
    data: FinancialSummary;
    currentMonthStr: string; // e.g. "08"
};

export function SummaryCards({ data, currentMonthStr }: Props) {
    const isYearly = currentMonthStr === "all";

    let currentData;
    let prevData = null;

    if (isYearly) {
        currentData = data.yearly;
    } else {
        const currentIndex = data.monthly.findIndex(m => m.month === currentMonthStr);
        currentData = data.monthly[currentIndex] || data.monthly[data.monthly.length - 1];
        prevData = currentIndex > 0 ? data.monthly[currentIndex - 1] : null;
    }

    const currentCash = data.currentCashBalance;
    const sales = currentData.sales;
    const profit = currentData.operatingProfit;
    const expenses = currentData.totalExpenses;

    const salesChange = prevData && prevData.sales !== 0
        ? ((sales - prevData.sales) / prevData.sales) * 100
        : 0;

    const profitChange = prevData && prevData.operatingProfit !== 0
        ? ((profit - prevData.operatingProfit) / Math.abs(prevData.operatingProfit)) * 100
        : 0;

    const formatCurrency = (val: number) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Cash Balance */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">現在の現預金残高</p>
                        <h3 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
                            {formatCurrency(currentCash)}
                        </h3>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            {/* Monthly Sales */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{isYearly ? "年間の売上高 (全体)" : `当月の売上高 (${currentMonthStr}月)`}</p>
                        <h3 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
                            {formatCurrency(sales)}
                        </h3>
                    </div>
                    <div className="rounded-full bg-accent/10 p-3">
                        <DollarSign className="h-6 w-6 text-accent" />
                    </div>
                </div>
                {!isYearly && (
                    <div className="mt-4 flex items-center text-sm">
                        {prevData ? (
                            <>
                                {salesChange >= 0 ? (
                                    <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="mr-1 h-4 w-4 text-destructive" />
                                )}
                                <span className={cn("font-medium", salesChange >= 0 ? "text-emerald-500" : "text-destructive")}>
                                    {salesChange >= 0 ? "+" : ""}{salesChange.toFixed(1)}%
                                </span>
                                <span className="ml-2 text-muted-foreground">前月比</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">前月データなし</span>
                        )}
                    </div>
                )}
            </div>

            {/* Monthly Profit */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{isYearly ? "年間の営業利益 (全体)" : `当月の営業利益 (${currentMonthStr}月)`}</p>
                        <h3 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
                            {formatCurrency(profit)}
                        </h3>
                    </div>
                    <div className="rounded-full bg-emerald-500/10 p-3">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                </div>
                {!isYearly && (
                    <div className="mt-4 flex items-center text-sm">
                        {prevData ? (
                            <>
                                {profitChange >= 0 ? (
                                    <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="mr-1 h-4 w-4 text-destructive" />
                                )}
                                <span className={cn("font-medium", profitChange >= 0 ? "text-emerald-500" : "text-destructive")}>
                                    {profitChange >= 0 ? "+" : ""}{profitChange.toFixed(1)}%
                                </span>
                                <span className="ml-2 text-muted-foreground">前月比</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">前月データなし</span>
                        )}
                    </div>
                )}
            </div>

            {/* Monthly Expenses */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{isYearly ? "年間の経費合計 (全体)" : `当月の経費合計 (${currentMonthStr}月)`}</p>
                        <h3 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
                            {formatCurrency(expenses)}
                        </h3>
                    </div>
                    <div className="rounded-full bg-destructive/10 p-3">
                        <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                </div>
                {!isYearly && (
                    <div className="mt-4 flex items-center text-sm">
                        {prevData ? (
                            <>
                                {expenses >= prevData.totalExpenses ? (
                                    <TrendingUp className="mr-1 h-4 w-4 text-destructive" />
                                ) : (
                                    <TrendingDown className="mr-1 h-4 w-4 text-emerald-500" />
                                )}
                                <span className={cn("font-medium", expenses <= prevData.totalExpenses ? "text-emerald-500" : "text-destructive")}>
                                    {prevData.totalExpenses !== 0
                                        ? (((expenses - prevData.totalExpenses) / prevData.totalExpenses) * 100).toFixed(1)
                                        : "0.0"}%
                                </span>
                                <span className="ml-2 text-muted-foreground">前月比</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">前月データなし</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
