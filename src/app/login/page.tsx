import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <Image
          src="/loginvoice.png"
          alt="invoiceHub"
          width={960}
          height={380}
          className="h-auto w-full object-contain"
          priority
        />
        <div className="w-[94%]">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
