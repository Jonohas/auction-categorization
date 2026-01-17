import { useItemSelectionStore } from "../stores/itemSelectionStore";

interface ItemSelectionCheckboxProps {
  itemId: string;
}

export function ItemSelectionCheckbox({ itemId }: ItemSelectionCheckboxProps) {
  const { toggleItem, isSelected } = useItemSelectionStore();

  return (
    <div
      className="absolute top-2 left-2 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isSelected(itemId)}
        onChange={() => toggleItem(itemId)}
        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      />
    </div>
  );
}
