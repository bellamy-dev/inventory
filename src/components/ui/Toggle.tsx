import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-gta-accent" : "bg-gta-border"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
      {label && <span className="text-sm text-gta-text">{label}</span>}
    </label>
  );
}
