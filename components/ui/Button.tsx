import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm",
      secondary:
        "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-200",
      outline:
        "bg-transparent text-zinc-900 border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
      ghost: "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500",
    };
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
export { Button };
