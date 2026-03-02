import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import {
  fetchAdminActivityFilters,
  fetchAdminActivityLogs,
} from "./activity.api";
import type { AdminActivityFilters, AdminActivityLog } from "./activity.types";

const ActivityLogs = () => {
  const [mode, setMode] = useState<"internal" | "system">("internal");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    admin_id: "",
    entity_type: "",
    event_type: "",
    date_from: "",
    date_to: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [filtersData, setFiltersData] = useState<AdminActivityFilters>({
    admins: [],
    event_types: [],
    entity_types: [],
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminActivityLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminActivityLog | null>(null);

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      page,
      limit: 20,
    }),
    [filters, page, debouncedSearch]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      const value = searchTerm.trim();
      setDebouncedSearch(value.length >= 1 ? value : "");
    }, 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    if (mode !== "internal") return;
    let active = true;
    fetchAdminActivityFilters()
      .then((res) => {
        if (!active) return;
        setFiltersData(res);
      })
      .catch(() => {
        if (!active) return;
        setFiltersData({ admins: [], event_types: [], entity_types: [] });
      });
    return () => {
      active = false;
    };
  }, [mode, refreshKey]);

  useEffect(() => {
    if (mode !== "internal") return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdminActivityLogs(queryParams)
      .then((res) => {
        if (!active) return;
        setData(res.items);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load activity logs");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [queryParams, mode, refreshKey]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const clearFilters = () => {
    const cleared = {
      admin_id: "",
      entity_type: "",
      event_type: "",
      date_from: "",
      date_to: "",
    };
    setSearchTerm("");
    setFilters(cleared);
    setDraftFilters(cleared);
    setPage(1);
  };

  const handleRefresh = () => {
    if (mode !== "internal" || loading || refreshing) return;
    setError(null);
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Header title="Activity Log" subtitle="Audit and operational timeline" />

      <section className="panel filters-panel">
        <div className="toggle-row">
          <button
            className={`ghost-btn ${mode === "internal" ? "ghost-btn--primary" : ""}`}
            onClick={() => setMode("internal")}
          >
            Internal
          </button>
          <button
            className={`ghost-btn ${mode === "system" ? "ghost-btn--primary" : ""}`}
            onClick={() => setMode("system")}
          >
            System / Client
          </button>
        </div>

        {mode === "internal" ? (
          <>
            <div className="search-row">
              <div className="filter-field">
                <label>Search</label>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search description or metadata"
                />
              </div>
            </div>
            <div className="filters-row">
              <div className="filter-field">
                <label>Admin</label>
                <select
                  value={draftFilters.admin_id}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, admin_id: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {filtersData.admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label>Entity Type</label>
                <select
                  value={draftFilters.entity_type}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, entity_type: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {filtersData.entity_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label>Event Type</label>
                <select
                  value={draftFilters.event_type}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, event_type: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {filtersData.event_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-actions">
                <button
                  className="ghost-btn icon-btn"
                  onClick={handleRefresh}
                  disabled={mode !== "internal" || loading || refreshing}
                  title="Refresh activity logs"
                  aria-label="Refresh activity logs"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M16.4 10a6.4 6.4 0 1 1-1.6-4.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16.4 4.2v4.2h-4.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="ghost-btn" onClick={clearFilters}>
                  Clear
                </button>
                <button className="ghost-btn ghost-btn--primary" onClick={applyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {mode === "system" ? (
        <div className="panel muted">System / Client Activity Logs – Under Development</div>
      ) : (
        <>
          {error ? <div className="alert">{error}</div> : null}
          <section className="panel users-table">
            {loading ? (
              <div className="muted">Loading activity logs...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Entity Type</th>
                    <th>Description</th>
                    <th>Admin</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No activity logs found.
                      </td>
                    </tr>
                  ) : (
                    data.map((log) => (
                      <tr key={log.id} onClick={() => setSelected(log)}>
                        <td>{log.event_type}</td>
                        <td>{log.entity_type}</td>
                        <td>{log.description}</td>
                        <td>{log.admin_email || "â€”"}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </section>

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
        </>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selected.event_type}</div>
                <div className="muted">{selected.entity_type}</div>
              </div>
              <button className="ghost-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">Description</div>
                <div className="modal-value">{selected.description}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Admin</div>
                <div className="modal-value">{selected.admin_email || "â€”"}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Entity ID</div>
                <div className="modal-value">{selected.entity_id || "â€”"}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Correlation ID</div>
                <div className="modal-value">{selected.correlation_id || "â€”"}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Timestamp</div>
                <div className="modal-value">
                  {new Date(selected.created_at).toLocaleString()}
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Metadata</div>
                <pre className="modal-json">
                  {JSON.stringify(selected.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
