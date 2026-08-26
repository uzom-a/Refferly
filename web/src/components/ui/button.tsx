import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md",
  outline:
    "border border-indigo-600/20 bg-white text-indigo-700 hover:bg-indigo-50",
  ghost:
    "bg-transparent text-slate-800 hover:bg-slate-100 dark:text-slate-100",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";


