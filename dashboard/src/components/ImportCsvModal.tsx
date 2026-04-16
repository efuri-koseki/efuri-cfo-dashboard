"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { X, UploadCloud, FileType, CheckCircle2, ChevronRight, Loader2, Play } from "lucide-react";
import { JournalEntry, EXPENSE_ACCOUNTS, LIABILITY_ACCOUNTS } from "../types/journal";
import { cn } from "../lib/utils";
import { appendJournalEntries } from "@/app/actions/journal";
import { useRouter } from "next/navigation";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ACCOUNT_OPTIONS = Array.from(new Set([
    "売上高", "普通預金", "現金", "未払金", "不明",
    ...EXPENSE_ACCOUNTS, ...LIABILITY_ACCOUNTS
]));

export function ImportCsvModal({ isOpen, onClose }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewData, setPreviewData] = useState<JournalEntry[] | null>(null);
    const router = useRouter();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setPreviewData(null); // Reset preview
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "text/csv": [".csv"] },
        maxFiles: 1,
    });

    const handleAnalyze = () => {
        if (!file) return;
        setIsAnalyzing(true);

        Papa.parse(file, {
            encoding: 'Shift-JIS',
            complete: async (results) => {
                try {
                    const rows = results.data as string[][];

                    // Send to our Next.js backend API
                    const response = await fetch('/api/ai-journal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rows })
                    });

                    if (!response.ok) {
                        const errBody = await response.json();
                        throw new Error(errBody.error || 'Failed to fetch AI categorization');
                    }

                    const { entries } = await response.json();

                    // Add unique IDs safely
                    const formattedEntries: JournalEntry[] = entries.map((en: any, index: number) => ({
                        id: `ai-preview-${index}-${Date.now()}`,
                        Date: en.Date || new Date().toISOString().split("T")[0],
                        Debit_Account: en.Debit_Account || "不明",
                        Debit_Amount: Number(en.Debit_Amount) || 0,
                        Credit_Account: en.Credit_Account || "不明",
                        Credit_Amount: Number(en.Credit_Amount) || 0,
                        Description: en.Description || "",
                        Client: en.Client || "",
                    }));

                    setPreviewData(formattedEntries);
                } catch (error: any) {
                    console.error("AI Categorization Error:", error);
                    alert(`エラーが発生しました: ${error.message}`);
                } finally {
                    setIsAnalyzing(false);
                }
            },
            error: (err) => {
                console.error("CSV Parse Error:", err);
                alert(`CSVの読み込みに失敗しました: ${err.message}`);
                setIsAnalyzing(false);
            }
        });
    };

    const handleReset = () => {
        setFile(null);
        setPreviewData(null);
    };

    const handleSave = async () => {
        if (!previewData) return;
        setIsSaving(true);
        const result = await appendJournalEntries(previewData);
        setIsSaving(false);

        if (result.success) {
            router.refresh();
            onClose();
        } else {
            alert("保存に失敗しました: " + result.error);
        }
    };

    const handleAccountChange = (index: number, field: 'Debit_Account' | 'Credit_Account', value: string) => {
        setPreviewData(prev => {
            if (!prev) return prev;
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6 transition-all">
            <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-6 bg-secondary/20">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">CSVインポート & AI仕訳</h2>
                        <p className="text-sm text-muted-foreground mt-1">銀行やクレジットカードの明細をアップロードすると、AIが自動で仕訳を推論します。</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Step 1: Upload */}
                    {!previewData && (
                        <div className="mx-auto max-w-2xl space-y-8">

                            <div
                                {...getRootProps()}
                                className={cn(
                                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300",
                                    isDragActive
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50 hover:bg-secondary/30",
                                    file && "border-emerald-500/50 bg-emerald-500/5"
                                )}
                            >
                                <input {...getInputProps()} />

                                {file ? (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                        <div className="rounded-full bg-emerald-500/20 p-4 mb-4 text-emerald-500">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                        <p className="text-lg font-medium text-foreground">{file.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="mt-4 text-sm text-destructive hover:underline"
                                        >
                                            別のファイルを選択
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="rounded-full bg-secondary p-4 mb-4 text-primary group-hover:scale-110 transition-transform">
                                            <UploadCloud className="h-10 w-10" />
                                        </div>
                                        <p className="text-lg font-medium text-foreground">クリックまたはドラッグ＆ドロップ</p>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                            対応フォーマット: .csv<br />銀行の入出金明細や、カード会社の利用明細をそのままアップロード可能です。
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!file || isAnalyzing}
                                    className={cn(
                                        "inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all",
                                        file
                                            ? "bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95"
                                            : "bg-muted text-muted-foreground cursor-not-allowed",
                                        isAnalyzing && "pointer-events-none opacity-80"
                                    )}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            AIが仕訳を推論中...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            AI仕訳を実行する
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {previewData && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground flex items-center">
                                        <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
                                        AI推論完了
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {previewData.length} 件の取引データを解析しました。内容を確認し、問題なければ登録してください。
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    やり直す
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-sm text-left relative">
                                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">発生日</th>
                                                <th className="px-4 py-3 font-semibold text-[#38bdf8]">借方勘定科目 (🤖)</th>
                                                <th className="px-4 py-3 font-semibold text-right">借方金額</th>
                                                <th className="px-4 py-3 font-semibold text-[#10b981]">貸方勘定科目 (🤖)</th>
                                                <th className="px-4 py-3 font-semibold text-right">貸方金額</th>
                                                <th className="px-4 py-3 font-semibold">摘要 (元データ)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {previewData.map((row, idx) => (
                                                <tr key={row.id} className="hover:bg-secondary/20 transition-colors group">
                                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.Date}</td>
                                                    <td className="px-4 py-3 font-medium text-foreground relative">
                                                        <select
                                                            value={row.Debit_Account}
                                                            onChange={(e) => handleAccountChange(idx, 'Debit_Account', e.target.value)}
                                                            className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-secondary transition-colors"
                                                            title="クリックして勘定科目を手動修正"
                                                        >
                                                            {!ACCOUNT_OPTIONS.includes(row.Debit_Account) && (
                                                                <option value={row.Debit_Account}>{row.Debit_Account}</option>
                                                            )}
                                                            {ACCOUNT_OPTIONS.map(opt => (
                                                                <option key={`debit-${idx}-${opt}`} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{row.Debit_Amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-medium text-foreground relative">
                                                        <select
                                                            value={row.Credit_Account}
                                                            onChange={(e) => handleAccountChange(idx, 'Credit_Account', e.target.value)}
                                                            className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-secondary transition-colors"
                                                            title="クリックして勘定科目を手動修正"
                                                        >
                                                            {!ACCOUNT_OPTIONS.includes(row.Credit_Account) && (
                                                                <option value={row.Credit_Account}>{row.Credit_Account}</option>
                                                            )}
                                                            {ACCOUNT_OPTIONS.map(opt => (
                                                                <option key={`credit-${idx}-${opt}`} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{row.Credit_Amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 truncate max-w-xs text-muted-foreground group-hover:text-foreground transition-colors" title={row.Description}>
                                                        {row.Description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-border">
                                <button
                                    onClick={onClose}
                                    className="rounded-lg px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                    onClick={handleSave}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            登録中...
                                        </>
                                    ) : (
                                        <>
                                            この仕訳データで登録する
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
