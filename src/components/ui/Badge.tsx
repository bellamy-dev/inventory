interface BadgeProps {
  color?: string;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ color = "#6b7280", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: color + "22", color: color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}
