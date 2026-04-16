import { LoginForm } from "./LoginForm";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 flex-col gap-4 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">CFO Dashboard Login</h1>
            <LoginForm />
        </div>
    );
}
