import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = ({
  value,
  onChange,
  placeholder,
  className = "",
}: SearchInputProps) => {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm ${className}`}
    >
      <Search size={14} className="text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
};

export default SearchInput;
