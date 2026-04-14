import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, className, id, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor={id} className="text-secondary font-bold text-sm ml-2">
        {label}
      </label>
      <div className="clay-inset bg-surface-container-low rounded-xl px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-primary/20">
        <input
          id={id}
          className={cn(
            "bg-transparent border-none w-full outline-none text-on-surface placeholder:text-on-surface-variant/50",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};
