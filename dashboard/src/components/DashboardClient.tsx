"use client";

import { useState } from "react";
import { FinancialSummary, MONTHS_ORDER } from "../lib/calculations";
import { SummaryCards } from "./SummaryCards";
import { FinancialChart } from "./FinancialChart";
import { MatrixTable } from "./MatrixTable";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type Props = {
    financialData: FinancialSummary;
    initialMonth: string;
};

export function DashboardClient({ financialData, initialMonth }: Props) {
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);

    const PERIODS = ["all", ...MONTHS_ORDER];

    const handlePrevMonth = () => {
        const currentIndex = PERIODS.indexOf(selectedMonth);
        if (currentIndex > 0) {
            setSelectedMonth(PERIODS[currentIndex - 1]);
        }
    };

    const handleNextMonth = () => {
        const currentIndex = PERIODS.indexOf(selectedMonth);
        if (currentIndex < PERIODS.length - 1) {
            setSelectedMonth(PERIODS[currentIndex + 1]);
        }
    };

    return (
        <>
            {/* Month Picker Controls */}
            <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm animate-in fade-in duration-500">
                <div className="flex items-center text-muted-foreground">
                    <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">表示月の選択</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevMonth}
                        disabled={PERIODS.indexOf(selectedMonth) === 0}
                        className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="前月"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-secondary/50 border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block w-32 p-2.5 appearance-none cursor-pointer text-center font-bold"
                        >
                            <option value="all">2026年 全体 (年間)</option>
                            {MONTHS_ORDER.map((m) => (
                                <option key={m} value={m}>
                                    {m === "01" || m === "02" || m === "03" || m === "04" || m === "05" || m === "06" || m === "07" || m === "08" ? "2026年" : "2025年"} {m}月
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        disabled={PERIODS.indexOf(selectedMonth) === PERIODS.length - 1}
                        className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="次月"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* 1. Summary Cards (Linked to selectedMonth) */}
            <SummaryCards data={financialData} currentMonthStr={selectedMonth} />

            {/* Charts Section: Line Chart + Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    {/* The Line Chart shows all months' trends, so it doesn't need to filter by selectedMonth, 
                        but we pass financialData directly */}
                    <FinancialChart data={financialData} />
                </div>
                <div className="lg:col-span-1">
                    {/* The Donut Chart (Breakdown) is linked to selectedMonth */}
                    <ExpenseBreakdownChart data={financialData} currentMonthStr={selectedMonth} />
                </div>
            </div>

            {/* 3. Matrix Table (Shows all months implicitly) */}
            <MatrixTable data={financialData} />
        </>
    );
}
