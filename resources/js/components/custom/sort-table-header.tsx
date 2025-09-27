import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableHeaderProps {
  column: string;
  label: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

export default function SortableHeader({
  column,
  label,
  sortBy,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortBy === column;

  // Default arrow is up unless active
  let ArrowIcon = ChevronUp;
  let arrowClass = "text-gray-400 dark:text-gray-500";

  if (isActive) {
    ArrowIcon = sortDirection === "asc" ? ChevronUp : ChevronDown;
    arrowClass = "text-blue-500";
  }

  return (
    <th
      onClick={() => onSort(column)}
      className="cursor-pointer px-4 py-2 text-left select-none hover:bg-gray-50 dark:hover:bg-neutral-700"
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <ArrowIcon size={16} className={arrowClass} />
      </div>
    </th>
  );
}
