import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  children: React.ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const baseClass =
    variant === "primary"
      ? "gta-btn-primary"
      : variant === "danger"
        ? "gta-btn-danger"
        : "gta-btn-ghost";

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
