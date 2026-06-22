import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gta-text-dim">{label}</label>
      )}
      <input
        className={`gta-input ${error ? "border-gta-danger focus:border-gta-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-gta-danger">{error}</span>}
    </div>
  );
}
