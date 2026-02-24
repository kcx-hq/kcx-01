import React from "react";

/**
 * Safely render ANY value inside a table cell
 * Handles primitives, arrays, objects, React elements
 */
const renderValue = (value) => {
  // 1️⃣ Valid React element → render directly
  if (React.isValidElement(value)) {
    return value;
  }

  // 2️⃣ Null / undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">null</span>;
  }

  // 3️⃣ Primitive values
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // 4️⃣ Arrays
  if (Array.isArray(value)) {
    return (
      <span className="text-blue-400">
        {value.map(String).join(", ")}
      </span>
    );
  }

  // 5️⃣ Plain objects (tags, metadata, labels, etc.)
  if (typeof value === "object") {
    try {
      return (
        <span className="text-blue-400">
          {Object.entries(value)
            .map(([key, val]) => `${key}: ${val}`)
            .join(" | ")}
        </span>
      );
    } catch {
      return <span className="text-red-400">[Object]</span>;
    }
  }

  // 6️⃣ Fallback (symbols, functions, etc.)
  return String(value);
};

const TableRow = ({
  row,
  rowIndex,
  visibleColumns,
  selectedIndices,
  handleRowSelect,
  handleRowClick,
  getRowHeight,
  getColumnWidth,
  showDataBars,
  columnMaxValues
}) => {
  const isSelected = selectedIndices.has(rowIndex);
  const rowHeightClass = getRowHeight();

  return (
    <tr
      className={`${rowHeightClass} ${
        isSelected
          ? "bg-[#1EA88A]/20 border-l-4 border-[#1EA88A]"
          : "hover:bg-white/5"
      } transition-colors cursor-pointer`}
      onClick={(e) => {
        if (e.target.type !== "checkbox") {
          handleRowClick(row);
        }
      }}
    >
      {/* Selection Checkbox */}
      <td className="px-4 py-2 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleRowSelect(rowIndex)}
          className="rounded border-gray-600 bg-gray-800 text-[#1EA88A] focus:ring-[#1EA88A]"
        />
      </td>

      {/* Data Cells */}
      {visibleColumns.map((col, colIndex) => {
        const value = row[col];
        const maxValue = columnMaxValues?.[col] ?? 0;

        const numericValue =
          typeof value === "number"
            ? value
            : typeof value === "string" && !isNaN(parseFloat(value))
            ? parseFloat(value)
            : null;

        const percentage =
          numericValue !== null && maxValue > 0
            ? (numericValue / maxValue) * 100
            : 0;

        return (
          <td
            key={colIndex}
            className={`px-4 py-2 text-sm text-gray-300 relative ${
              colIndex === 0 ? "font-medium" : ""
            }`}
            style={{ width: `${getColumnWidth(colIndex)}px` }}
          >
            {/* Data bar */}
            {showDataBars && numericValue !== null && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#1EA88A]/10 rounded-r"
                style={{ width: `${percentage}%` }}
              />
            )}

            <div className="relative z-10 truncate">
              {renderValue(value)}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
