"use client";

import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[88px] resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: InputHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 shadow-sm",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-300",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    danger: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

/** A collapsible card — the editor is long, so every group can be folded away. */
export function Accordion({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {title}
          {typeof count === "number" && count > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {count}
            </span>
          ) : null}
        </span>
        <span
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

/** Repeatable entry wrapper: reorder and delete controls in a consistent place. */
export function EntryCard({
  title,
  onUp,
  onDown,
  onRemove,
  children,
}: {
  title: string;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-slate-600">{title}</span>
        <span className="flex shrink-0 items-center gap-0.5">
          <IconButton label="Move up" onClick={onUp} disabled={!onUp}>
            ↑
          </IconButton>
          <IconButton label="Move down" onClick={onDown} disabled={!onDown}>
            ↓
          </IconButton>
          <IconButton label="Remove" onClick={onRemove} danger>
            ✕
          </IconButton>
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`h-7 w-7 rounded-md text-xs transition disabled:opacity-25 ${
        danger
          ? "text-rose-500 hover:bg-rose-50"
          : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
