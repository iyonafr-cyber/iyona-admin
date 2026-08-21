import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

const Card = ({
  children,
  title,
  actions,
  className = "",
  bodyClassName = "",
}: CardProps) => {
  return (
    <div
      className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
