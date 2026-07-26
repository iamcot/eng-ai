import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
