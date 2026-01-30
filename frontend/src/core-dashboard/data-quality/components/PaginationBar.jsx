
const PaginationBar = ({
  currentPage,
  totalPages,
  actualTotalPages,
  accessiblePages,
  isLocked,
  maxAllowedPage,
  onPrev,
  onNext,
}) => {
  const safeTotalPages = totalPages || 1;
  const safePage = currentPage > safeTotalPages ? safeTotalPages : currentPage;

  

  return (
    <div className="p-3 bg-[#15161a] border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
      <span>
        Page {safePage} of {safeTotalPages}
        {isLocked && actualTotalPages > accessiblePages && (
          <span className="text-gray-500 ml-1">({actualTotalPages} total)</span>
        )}
      </span>

      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
        >
          Prev
        </button>

        <button
          onClick={onNext}
          disabled={
            isLocked
              ? currentPage >= maxAllowedPage ||
                (currentPage >= accessiblePages && actualTotalPages <= accessiblePages)
              : currentPage >= safeTotalPages
          }
          className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;
