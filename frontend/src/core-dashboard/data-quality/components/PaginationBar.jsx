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
    <div className="flex items-center justify-between border-t border-[var(--border-light)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-muted)]">
      <span>
        Page {safePage} of {safeTotalPages}
        {isLocked && actualTotalPages > accessiblePages && (
          <span className="ml-1 text-[var(--text-muted)]">({actualTotalPages} total)</span>
        )}
      </span>

      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="rounded border border-[var(--border-light)] bg-white px-3 py-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-30"
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
          className="rounded border border-[var(--border-light)] bg-white px-3 py-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;

