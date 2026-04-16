"use client";

import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { FinancialSummary } from "../lib/calculations";

type Props = {
    data: FinancialSummary;
};

export function FinancialChart({ data }: Props) {
    // Format data for Recharts
    const chartData = data.monthly.map((m) => ({
        name: `${m.month}月`,
        売上高: m.sales,
        営業利益: m.operatingProfit,
        経費: m.totalExpenses,
    }));

    const formatYAxis = (tickItem: number) => {
        return new Intl.NumberFormat("ja-JP", {
            notation: "compact",
            compactDisplay: "short",
        }).format(tickItem);
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-card-foreground mb-4">月次推移（売上高・経費・営業利益）</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            tickFormatter={formatYAxis}
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={formatYAxis}
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "0.5rem",
                                color: "#f8fafc",
                            }}
                            formatter={(value: any) =>
                                new Intl.NumberFormat("ja-JP", {
                                    style: "currency",
                                    currency: "JPY",
                                }).format(value)
                            }
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar
                            yAxisId="left"
                            dataKey="売上高"
                            barSize={20}
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="経費"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#ef4444", strokeWidth: 2, stroke: "#1e293b" }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="営業利益"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#1e293b" }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
