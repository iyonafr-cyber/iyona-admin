interface StatusDotProps {
  tone: "success" | "warning" | "danger" | "neutral";
  title?: string;
}

const toneClasses: Record<StatusDotProps["tone"], string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-muted-foreground",
};

const StatusDot = ({ tone, title }: StatusDotProps) => {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${toneClasses[tone]}`}
      title={title}
    />
  );
};

export default StatusDot;
