import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  message?: string | null;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-5 py-6">
      <h2 className="text-sm font-semibold text-red-900">{title}</h2>
      {message ? <p className="mt-1 text-sm text-red-800">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
