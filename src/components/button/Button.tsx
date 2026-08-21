import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200";

  const variantStyles = {
    primary:
      "bg-foreground text-background hover:bg-foreground/85 hover:cursor-pointer",
    secondary:
      "bg-muted text-foreground hover:bg-muted/85 hover:cursor-pointer",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
