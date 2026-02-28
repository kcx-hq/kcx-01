import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import {
  fetchInquiries,
  relayInquiry,
  updateInquiryStatus,
  bulkUpdateInquiries,
  deleteInquiry,
  bulkDeleteInquiries,
} from "./inquiries.api";
import type { AdminInquiry } from "./inquiries.types";

const STATUS_OPTIONS = ["PENDING", "ACCEPTED", "REJECTED", "STANDBY", "HANDLED", "TRASHED"] as const;
const OVERDUE_DAYS = 3;
const TRASH_RETENTION_DAYS = 7;

const toLocal = (iso?: string | null) => {
  if (!iso) return "—";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(iso).toLocaleString(undefined, { timeZone: tz });
};

const isOverdue = (inquiry: AdminInquiry) => {
  if (inquiry.status !== "PENDING") return false;
  const created = new Date(inquiry.activity_time).getTime();
  const cutoff = Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  return created < cutoff;
};

const Inquiries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    sort: "desc",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminInquiry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminInquiry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [relayOpen, setRelayOpen] = useState(false);
  const [relaySeverity, setRelaySeverity] = useState("LOW");
  const [relayNote, setRelayNote] = useState("");
  const [relayToast, setRelayToast] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "handled" | "trash">("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      page,
      limit: 10,
      ...(viewMode === "trash"
        ? { status: "TRASHED" }
        : viewMode === "handled"
        ? { status: "HANDLED" }
        : { exclude_status: "TRASHED,HANDLED" }),
    }),
    [filters, page, debouncedSearch, viewMode]
  );

  const expiredTrashCount = useMemo(() => {
    if (viewMode !== "trash") return 0;
    const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return data.filter((item) => item.trashed_at && new Date(item.trashed_at).getTime() <= cutoff)
      .length;
  }, [data, viewMode]);

  useEffect(() => {
    const id = setTimeout(() => {
      const value = searchTerm.trim();
      setDebouncedSearch(value.length >= 1 ? value : "");
    }, 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(true);
    fetchInquiries(queryParams)
      .then((res) => {
        if (!active) return;
        setData(res.items);
        setTotalPages(res.totalPages);
        setError(null);
        setSelectedIds([]);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load inquiries");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryParams]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const clearFilters = () => {
    const cleared = { status: "", sort: "desc" };
    setSearchTerm("");
    setFilters(cleared);
    setDraftFilters(cleared);
    setPage(1);
  };

  const openInquiry = (inquiry: AdminInquiry) => {
    setSelected(inquiry);
    setActionError(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectableIds = data.filter((item) => item.status !== "PENDING").map((item) => item.id);
    if (selectedIds.length === selectableIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIds);
    }
  };

  const handleSingleStatus = async (id: string, status: AdminInquiry["status"]) => {
    setUpdating(true);
    try {
      await updateInquiryStatus(id, status);
      setData((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setBulkError(null);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to update inquiry");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkStatus = async (status: AdminInquiry["status"]) => {
    if (selectedIds.length === 0) return;
    setUpdating(true);
    try {
      await bulkUpdateInquiries(selectedIds, status);
      setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setBulkError(null);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to update inquiries");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setUpdating(true);
    try {
      await bulkDeleteInquiries(selectedIds);
      setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setBulkError(null);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to delete inquiries");
    } finally {
      setUpdating(false);
    }
  };

  const openRelay = () => {
    if (!selected) return;
    setRelaySeverity("LOW");
    setRelayNote("");
    setRelayOpen(true);
  };

  const submitRelay = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await relayInquiry(selected.id, {
        severity: relaySeverity,
        note: relayNote.trim() || undefined,
      });
      setRelayToast("Relayed to boss.");
      setTimeout(() => setRelayToast(null), 2500);
      setRelayOpen(false);
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to relay inquiry");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <Header title="Inquiries" subtitle="Handle inbound client requests" />

      {error ? <div className="alert">{error}</div> : null}
      {viewMode === "trash" && expiredTrashCount > 0 ? (
        <div className="alert">
          {expiredTrashCount} inquiry(s) have been in the recycle bin for 7+ days. Please empty the bin.
        </div>
      ) : null}

      <section className="panel filters-panel">
        <div className="toggle-row">
          <button
            className={`ghost-btn ${viewMode === "active" ? "ghost-btn--primary" : ""}`}
            onClick={() => setViewMode("active")}
          >
            Active
          </button>
          <button
            className={`ghost-btn ${viewMode === "handled" ? "ghost-btn--primary" : ""}`}
            onClick={() => setViewMode("handled")}
          >
            Handled
          </button>
          <button
            className={`ghost-btn ${viewMode === "trash" ? "ghost-btn--primary" : ""}`}
            onClick={() => setViewMode("trash")}
          >
            Recycle Bin
          </button>
        </div>
        <div className="search-row">
          <div className="filter-field">
            <label htmlFor="inquiries-search">Search</label>
            <input
              id="inquiries-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or email"
            />
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-field">
            <label htmlFor="inquiries-status">Status</label>
            <select
              id="inquiries-status"
              value={draftFilters.status}
              onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="inquiries-sort">Sort</label>
            <select
              id="inquiries-sort"
              value={draftFilters.sort}
              onChange={(e) => setDraftFilters({ ...draftFilters, sort: e.target.value })}
            >
              <option value="">All</option>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          <div className="filter-actions">
            <button className="ghost-btn" onClick={clearFilters}>
              Clear
            </button>
            <button className="ghost-btn ghost-btn--primary" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </section>

      <section className="panel users-table">
        {loading ? (
          <div className="muted">Loading inquiries...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all inquiries"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Preferred Timeslot</th>
                <th>Timezone</th>
                <th>Status</th>
                <th>Created</th>
                <th className="actions-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                data.map((inquiry) => (
                  <tr key={inquiry.id} onClick={() => openInquiry(inquiry)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inquiry.id)}
                        disabled={inquiry.status === "PENDING"}
                        onChange={() => toggleSelect(inquiry.id)}
                        aria-label={`Select inquiry ${inquiry.name}`}
                      />
                    </td>
                    <td>
                      <div className="cell-primary">{inquiry.name}</div>
                      {isOverdue(inquiry) ? <div className="badge badge--warning">Overdue</div> : null}
                    </td>
                    <td>{inquiry.email}</td>
                    <td>{toLocal(inquiry.preferred_datetime)}</td>
                    <td>{inquiry.timezone}</td>
                    <td>
                      <span
                        className={`badge ${
                          inquiry.status === "ACCEPTED"
                            ? "badge--success"
                            : inquiry.status === "REJECTED"
                            ? "badge--failed"
                            : "badge--warning"
                        }`}
                      >
                        {inquiry.status}
                      </span>
                    </td>
                    <td>{new Date(inquiry.activity_time).toLocaleDateString()}</td>
                    <td className="actions-col">
                      <button className="ghost-btn" onClick={() => openInquiry(inquiry)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {bulkError ? <div className="alert">{bulkError}</div> : null}

      <div className="panel filter-actions">
        {viewMode === "active" ? (
          <>
            <button
              className="ghost-btn"
              disabled={selectedIds.length === 0 || updating}
              onClick={() => handleBulkStatus("HANDLED")}
            >
              Mark Handled
            </button>
            <button
              className="ghost-btn ghost-btn--danger"
              disabled={selectedIds.length === 0 || updating}
              onClick={() => handleBulkStatus("TRASHED")}
            >
              Move to Recycle Bin
            </button>
          </>
        ) : viewMode === "handled" ? (
          <>
            <button
              className="ghost-btn"
              disabled={selectedIds.length === 0 || updating}
              onClick={() => handleBulkStatus("PENDING")}
            >
              Restore to Active
            </button>
            <button
              className="ghost-btn ghost-btn--danger"
              disabled={selectedIds.length === 0 || updating}
              onClick={() => handleBulkStatus("TRASHED")}
            >
              Move to Recycle Bin
            </button>
          </>
        ) : (
          <>
            <button
              className="ghost-btn"
              disabled={selectedIds.length === 0 || updating}
              onClick={() => handleBulkStatus("PENDING")}
            >
              Restore
            </button>
            <button
              className="ghost-btn ghost-btn--danger"
              disabled={selectedIds.length === 0 || updating}
              onClick={handleBulkDelete}
            >
              Delete Permanently
            </button>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="ghost-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="ghost-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selected.name}</div>
                <div className="muted">{selected.email}</div>
              </div>
              <button className="ghost-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">Message</div>
                <div className="modal-value">{selected.message}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Preferred</div>
                <div className="modal-value">{toLocal(selected.preferred_datetime)}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Timezone</div>
                <div className="modal-value">{selected.timezone}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Status</div>
                <div className="modal-value">{selected.status}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Created</div>
                <div className="modal-value">
                  {new Date(selected.activity_time).toLocaleString()}
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Updated</div>
                <div className="modal-value">
                  {new Date(selected.updated_at).toLocaleString()}
                </div>
              </div>
              {actionError ? <div className="alert">{actionError}</div> : null}
            </div>
            <div className="modal-actions">
              {relayToast ? <div className="modal-toast">{relayToast}</div> : null}
              <button
                className="primary-btn"
                onClick={openRelay}
                disabled={updating || selected.status !== "PENDING"}
              >
                Relay to Boss
              </button>
              {selected.status === "PENDING" ? null : selected.status === "HANDLED" ? (
                <button
                  className="ghost-btn"
                  onClick={() => handleSingleStatus(selected.id, "PENDING")}
                  disabled={updating}
                >
                  Restore to Active
                </button>
              ) : selected.status !== "TRASHED" ? (
                <button
                  className="ghost-btn"
                  onClick={() => handleSingleStatus(selected.id, "HANDLED")}
                  disabled={updating}
                >
                  Mark Handled
                </button>
              ) : (
                <button
                  className="ghost-btn"
                  onClick={() => handleSingleStatus(selected.id, "PENDING")}
                  disabled={updating}
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {relayOpen && selected && (
        <div className="modal-backdrop" onClick={() => setRelayOpen(false)}>
          <div className="modal modal--compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Relay to Boss</div>
                <div className="muted">
                  {selected.name} • {selected.email}
                </div>
              </div>
              <button className="ghost-btn" onClick={() => setRelayOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">Severity</div>
                <select
                  id="inquiries-relay-severity"
                  aria-label="Relay severity"
                  value={relaySeverity}
                  onChange={(e) => setRelaySeverity(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="modal-row">
                <div className="modal-label">Internal Note</div>
                <textarea
                  id="inquiries-relay-note"
                  aria-label="Relay internal note"
                  value={relayNote}
                  onChange={(e) => setRelayNote(e.target.value)}
                  rows={4}
                  placeholder="Add internal context for the boss..."
                />
              </div>
              {actionError ? <div className="alert">{actionError}</div> : null}
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setRelayOpen(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={submitRelay} disabled={updating}>
                Confirm Relay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inquiries;
