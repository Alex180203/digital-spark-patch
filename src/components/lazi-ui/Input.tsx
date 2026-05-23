import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-150
          ${error ? "border-red-400 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}
