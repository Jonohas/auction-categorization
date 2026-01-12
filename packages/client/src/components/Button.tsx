import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
    ghost: "bg-transparent text-gray-500 hover:text-gray-700 border-transparent",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`inline-flex items-center justify-center border rounded-md shadow-sm font-medium transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  title: string;
  variant?: "default" | "danger";
}

export function IconButton({ icon, title, variant = "default", className = "", ...props }: IconButtonProps) {
  const variantStyles = {
    default: "text-gray-400 hover:text-gray-600",
    danger: "text-gray-400 hover:text-red-600",
  };

  return (
    <button
      className={`${variantStyles[variant]} ${className}`}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
}
