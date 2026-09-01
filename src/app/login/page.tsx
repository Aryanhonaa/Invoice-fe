import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">OutInvoice</p>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use your work email and password to open the billing workspace.</p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
