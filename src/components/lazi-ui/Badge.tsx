import React from "react";

type BadgeVariant = "ok" | "attention" | "urgent" | "info" | "pending" | "locked" | "demo";

const variantClasses: Record<BadgeVariant, string> = {
  ok: "bg-green-100 text-green-800 border-green-200",
  attention: "bg-amber-100 text-amber-800 border-amber-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  locked: "bg-slate-200 text-slate-500 border-slate-300",
  demo: "bg-purple-100 text-purple-700 border-purple-200",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "info", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
