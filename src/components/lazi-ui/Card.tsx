import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({ children, className = "", onClick, interactive = false }: CardProps) {
  const base = "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden";
  const interactiveClasses = interactive
    ? "cursor-pointer hover:shadow-md hover:border-blue-200 active:scale-[0.99] transition-all duration-150"
    : "";

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        className={`${base} ${interactiveClasses} w-full text-left ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`${base} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
