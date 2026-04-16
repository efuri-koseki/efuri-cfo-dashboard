"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FinancialSummary } from "../lib/calculations";

type Props = {
    data: FinancialSummary;
    currentMonthStr: string;
};

// Sleek SaaS color palette for the Donut Chart
const COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#eab308", // Yellow
    "#84cc16", // Lime
    "#22c55e", // Green
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#d946ef", // Fuchsia
    "#f43f5e", // Rose
];

export function ExpenseBreakdownChart({ data, currentMonthStr }: Props) {
    const isYearly = currentMonthStr === "all";
    const currentData = isYearly
        ? data.yearly
        : (data.monthly.find(m => m.month === currentMonthStr) || data.monthly[data.monthly.length - 1]);

    if (!currentData || currentData.totalExpenses === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-full flex flex-col">
                <h3 className="text-lg font-bold text-card-foreground mb-4">
                    {isYearly ? "年間の経費内訳 (全体)" : `当月の経費内訳 (${currentMonthStr}月)`}
                </h3>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    経費データがありません
                </div>
            </div>
        );
    }

    // Convert the expenses map into an array for Recharts, filtering out zeros
    const pieData = Object.entries(currentData.expenses)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
            name,
            value,
        }))
        // Sort by amount descending to make the chart look nice
        .sort((a, b) => b.value - a.value);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.value / currentData.totalExpenses) * 100).toFixed(1);
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-slate-100 font-sans">
                    <p className="font-bold mb-1">{data.name}</p>
                    <p className="text-lg text-emerald-400">
                        {new Intl.NumberFormat("ja-JP", {
                            style: "currency",
                            currency: "JPY",
                        }).format(data.value)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">構成比: {percentage}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-card-foreground mb-2">
                {isYearly ? "年間の経費内訳 (全体)" : `当月の経費内訳 (${currentMonthStr}月)`}
            </h3>
            <div className="flex-1 min-h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{
                                fontSize: '13px',
                                color: '#94a3b8'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
