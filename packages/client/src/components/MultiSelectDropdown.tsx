import { useState, useRef, useEffect } from "react";

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select...",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selected = options.find((o) => o.value === selectedValues[0]);
      return selected?.label || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center justify-between"
      >
        <span className={selectedValues.length === 0 ? "text-gray-400" : "text-gray-900"}>
          {getDisplayText()}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          <div className="py-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
