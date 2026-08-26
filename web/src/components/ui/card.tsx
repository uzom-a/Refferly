import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-700/20 bg-[color:var(--surface-elevated)] p-5 shadow-sm backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}


