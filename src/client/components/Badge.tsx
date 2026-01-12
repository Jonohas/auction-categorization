interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className = "" }: BadgeProps) {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-indigo-100 text-indigo-800",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}

interface ProbabilityBadgeProps {
  probability: number | null;
  label?: string;
}

export function ProbabilityBadge({ probability, label = "hardware" }: ProbabilityBadgeProps) {
  const getVariant = (): "default" | "success" | "warning" => {
    if (probability === null || probability === undefined) return "default";
    if (probability >= 0.7) return "success";
    if (probability >= 0.4) return "warning";
    return "default";
  };

  const formatProbability = () => {
    if (probability === null || probability === undefined) return "not yet estimated";
    return `${(probability * 100).toFixed(0)}%`;
  };

  return (
    <Badge variant={getVariant()} size="md">
      {formatProbability()} {label}
    </Badge>
  );
}

interface StatusBadgeProps {
  enabled: boolean;
}

export function StatusBadge({ enabled }: StatusBadgeProps) {
  return (
    <Badge variant={enabled ? "success" : "default"}>
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}
