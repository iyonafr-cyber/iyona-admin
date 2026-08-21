import { type ReactNode } from "react";

interface KPITileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

const KPITile = ({ label, value, hint, icon }: KPITileProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPITile;
