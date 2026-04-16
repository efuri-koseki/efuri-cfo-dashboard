"use client";

import { useActionState } from "react";
import { login } from "../../actions/auth";

export function LoginForm() {
    const [state, formAction, pending] = useActionState(login, null);

    return (
        <form action={formAction} className="w-full max-w-sm flex flex-col gap-5 bg-card p-8 rounded-lg shadow-sm border border-border">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                    {state.error}
                </div>
            )}
            <div className="flex flex-col gap-2">
                <label htmlFor="id" className="text-sm font-medium text-foreground">クライアントID</label>
                <input
                    required
                    id="id"
                    name="id"
                    type="text"
                    placeholder="koseki"
                    className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">パスワード</label>
                <input
                    required
                    id="password"
                    name="password"
                    type="password"
                    className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>
            <button
                disabled={pending}
                type="submit"
                className="mt-4 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md font-medium disabled:opacity-50"
            >
                {pending ? "ログイン中..." : "ログイン"}
            </button>
        </form>
    );
}
