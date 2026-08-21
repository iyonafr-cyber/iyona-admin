import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, pageSize, total, onChange }: PaginationProps) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-xs text-muted-foreground">
      <div>
        {total.toLocaleString()} total · page {page} of {pages}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={!canPrev}
          onClick={() => canPrev && onChange(page - 1)}
          className="p-1.5 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          disabled={!canNext}
          onClick={() => canNext && onChange(page + 1)}
          className="p-1.5 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
