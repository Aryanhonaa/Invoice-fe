"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { loginSchema } from "@/schemas/auth";

export function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(searchParams.get("next") || "/");
    }
  }, [router, searchParams, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't sign you in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-[12px] border border-border bg-surface p-6"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label="Email" htmlFor="login-email" required>
        <TextInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>
      <Field label="Password" htmlFor="login-password" required>
        <TextInput
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
