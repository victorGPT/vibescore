import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function Button({ label, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium " +
        "bg-accent text-on-accent hover:bg-accent/90 focus-visible:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-focus " +
        (className ? className : "")
      }
      {...props}
    >
      {label}
    </button>
  );
}
