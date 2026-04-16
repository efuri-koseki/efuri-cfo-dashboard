"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportCsvModal } from "./ImportCsvModal";

export function ImportCsvButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Upload className="mr-2 h-4 w-4" />
                CSVインポート (AI)
            </button>

            <ImportCsvModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
