"use client";

import { useTransition } from "react";
import { logout } from "../actions/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const [isPending, startTransition] = useTransition();
    return (
        <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
            <LogOut className="mr-2 h-4 w-4" />
            {isPending ? "Logging out..." : "Logout"}
        </button>
    );
}
