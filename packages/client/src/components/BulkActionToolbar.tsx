import { useState } from "react";
import { useItemSelectionStore } from "../stores/itemSelectionStore";
import { Button } from "./Button";

interface BulkActionToolbarProps {
  allItemIds: string[];
  onBulkCategorize: (itemIds: string[]) => Promise<void>;
}

const AIIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

export function BulkActionToolbar({ allItemIds, onBulkCategorize }: BulkActionToolbarProps) {
  const {
    selectedItemIds,
    clearSelection,
  } = useItemSelectionStore();
  const [isLoading, setIsLoading] = useState(false);

  const selectedCount = selectedItemIds.size;

  const handleBulkCategorize = async () => {
    if (selectedCount === 0) return;
    setIsLoading(true);
    try {
      await onBulkCategorize(Array.from(selectedItemIds));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {selectedCount > 0 && (
        <>
          <span className="text-sm text-gray-600">
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
          </span>

          <Button
            variant="primary"
            onClick={handleBulkCategorize}
            loading={isLoading}
            size="sm"
          >
            <AIIcon />
            <span className="ml-1">
              Bulk Categorize ({selectedCount})
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={clearSelection}
            size="sm"
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
