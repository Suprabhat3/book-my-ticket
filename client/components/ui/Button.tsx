import React from "react";
import { cn } from "@/lib/utils" // If available, else I'll define a simple cn

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const Button = ({ variant = "primary", className, children, ...props }: ButtonProps) => {
  const baseStyles = "px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 active:scale-95 hover:scale-105 cursor-pointer";
  const variants = {
    primary: "clay-button-primary text-on-primary",
    secondary: "clay-button-secondary text-on-secondary-container",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
