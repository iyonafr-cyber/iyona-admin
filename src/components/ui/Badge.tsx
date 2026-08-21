import { type ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary";

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-muted text-foreground/80 border border-border",
  success:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
  warning:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
  danger:
    "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30",
  info:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30",
  primary:
    "bg-primary/20 text-foreground border border-primary/30",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const Badge = ({ tone = "neutral", children, className = "" }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
