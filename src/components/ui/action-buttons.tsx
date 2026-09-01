import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="inline-flex flex-wrap items-center gap-1.5">{children}</div>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M11.2 2.5a1.4 1.4 0 0 1 2 2L6.1 11.6 3 12.5l.9-3.1 7.3-6.9Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.2 4.2 11.8 11.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8.2 6.6 11.2 12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 5h9M6 5V3.6A.6.6 0 0 1 6.6 3h2.8a.6.6 0 0 1 .6.6V5M5.2 5l.4 7.2a.8.8 0 0 0 .8.7h3.2a.8.8 0 0 0 .8-.7L10.8 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EditAction({
  onClick,
  disabled,
  size = "sm",
}: {
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <Button variant="edit" size={size} onClick={onClick} disabled={disabled}>
      <PencilIcon />
      Edit
    </Button>
  );
}

export function StatusAction({
  active,
  onClick,
  disabled,
  size = "sm",
}: {
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <Button variant={active ? "warning" : "success"} size={size} onClick={onClick} disabled={disabled}>
      {active ? <BanIcon /> : <CheckIcon />}
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}

export function DeleteAction({
  onClick,
  disabled,
  size = "sm",
}: {
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <Button variant="dangerSoft" size={size} onClick={onClick} disabled={disabled}>
      <TrashIcon />
      Delete
    </Button>
  );
}
