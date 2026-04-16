"use server";

import { cookies } from "next/headers";
import { clientsConfig } from "../lib/clients.config";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const password = formData.get("password") as string;

    const clientData = (clientsConfig as Record<string, any>)[id];

    if (!clientData || clientData.password !== password) {
        return { error: "IDまたはパスワードが間違っています。" };
    }

    const cookieStore = await cookies();
    cookieStore.set("client_id", id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });

    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("client_id");
    redirect("/login");
}
