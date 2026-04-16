import { FinancialSummary, MONTHS_ORDER } from "../lib/calculations";
import { EXPENSE_ACCOUNTS, LIABILITY_ACCOUNTS } from "../types/journal";
import { cn } from "../lib/utils";

type Props = {
    data: FinancialSummary;
};

export function MatrixTable({ data }: Props) {
    const formatCurrency = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("ja-JP").format(val);
    };

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden pb-4">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-card-foreground">月次推移表（マトリックス）</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold sticky left-0 bg-[#253246] z-10 w-48">勘定科目</th>
                            {MONTHS_ORDER.map((m) => (
                                <th key={m} scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                                    {m}月
                                </th>
                            ))}
                            <th scope="col" className="px-4 py-3 font-bold text-right text-primary-foreground whitespace-nowrap bg-secondary/50">
                                年間合計
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {/* 収益 */}
                        <tr className="bg-secondary/10">
                            <td className="px-4 py-2 font-bold text-card-foreground sticky left-0 bg-[#253246] z-10">[収益]</td>
                            <td colSpan={13}></td>
                        </tr>
                        <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-2 pl-8 text-muted-foreground sticky left-0 bg-card z-10 group-hover:bg-[#253246]">売上高</td>
                            {MONTHS_ORDER.map((m) => {
                                const mData = data.monthly.find((x) => x.month === m);
                                return (
                                    <td key={m} className="px-4 py-2 text-right text-card-foreground font-medium">
                                        {formatCurrency(mData?.sales || 0)}
                                    </td>
                                );
                            })}
                            <td className="px-4 py-2 text-right font-bold text-primary bg-secondary/20">
                                {formatCurrency(data.yearly.sales)}
                            </td>
                        </tr>

                        {/* 費用 */}
                        <tr className="bg-secondary/10">
                            <td className="px-4 py-2 font-bold text-card-foreground sticky left-0 bg-[#253246] z-10">[費用]</td>
                            <td colSpan={13}></td>
                        </tr>
                        {EXPENSE_ACCOUNTS.map((account) => {
                            // Only render if there's any value in the year to keep table clean, or render all. Required to render all since not requested to hide.
                            const yearlyVal = data.yearly.expenses[account];
                            if (yearlyVal === 0) return null; // hide zero balances for cleaner UI

                            return (
                                <tr key={account} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-2 pl-8 text-muted-foreground sticky left-0 bg-card z-10">{account}</td>
                                    {MONTHS_ORDER.map((m) => {
                                        const mData = data.monthly.find((x) => x.month === m);
                                        return (
                                            <td key={m} className="px-4 py-2 text-right">
                                                {formatCurrency(mData?.expenses[account] || 0)}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-2 text-right font-semibold bg-secondary/20 text-muted-foreground">
                                        {formatCurrency(yearlyVal)}
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-secondary/30 font-semibold">
                            <td className="px-4 py-2 pl-8 text-card-foreground sticky left-0 bg-[#253246] z-10">費用合計</td>
                            {MONTHS_ORDER.map((m) => {
                                const mData = data.monthly.find((x) => x.month === m);
                                return (
                                    <td key={m} className="px-4 py-2 text-right">
                                        {formatCurrency(mData?.totalExpenses || 0)}
                                    </td>
                                );
                            })}
                            <td className="px-4 py-2 text-right font-bold text-card-foreground bg-secondary/40">
                                {formatCurrency(data.yearly.totalExpenses)}
                            </td>
                        </tr>

                        {/* 営業利益 */}
                        <tr className="bg-emerald-900/20 font-bold border-t-2 border-emerald-500/30">
                            <td className="px-4 py-3 text-emerald-400 sticky left-0 bg-[#17252e] z-10">営業利益</td>
                            {MONTHS_ORDER.map((m) => {
                                const mData = data.monthly.find((x) => x.month === m);
                                const val = mData?.operatingProfit || 0;
                                return (
                                    <td key={m} className={cn("px-4 py-3 text-right", val < 0 ? "text-destructive" : "text-emerald-400")}>
                                        {formatCurrency(val)}
                                    </td>
                                );
                            })}
                            <td className={cn("px-4 py-3 text-right bg-emerald-900/40", data.yearly.operatingProfit < 0 ? "text-destructive" : "text-emerald-400")}>
                                {formatCurrency(data.yearly.operatingProfit)}
                            </td>
                        </tr>

                        {/* 特定負債 */}
                        <tr className="bg-secondary/10 border-t-4 border-border">
                            <td className="px-4 py-2 font-bold text-card-foreground sticky left-0 bg-[#253246] z-10">[特定負債] (月末残高)</td>
                            <td colSpan={13}></td>
                        </tr>
                        {LIABILITY_ACCOUNTS.map((account) => {
                            const yearlyVal = data.yearly.liabilities[account];
                            if (yearlyVal === 0) return null; // hide zero for cleaner UI

                            return (
                                <tr key={account} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-2 pl-8 text-muted-foreground sticky left-0 bg-card z-10">{account}</td>
                                    {MONTHS_ORDER.map((m) => {
                                        const mData = data.monthly.find((x) => x.month === m);
                                        return (
                                            <td key={m} className="px-4 py-2 text-right text-amber-500/90">
                                                {formatCurrency(mData?.liabilities[account] || 0)}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-2 text-right font-semibold bg-secondary/20 text-amber-400">
                                        {formatCurrency(yearlyVal)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
