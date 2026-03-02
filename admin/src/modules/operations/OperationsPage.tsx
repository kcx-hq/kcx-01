import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { fetchUploadDetail, fetchUploads } from "./operations.api";
import type { UploadItem } from "./operations.types";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const formatSize = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const OperationsPage = () => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selected, setSelected] = useState<UploadItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchUploads({ page, limit: 20 })
      .then((res) => {
        if (!active) return;
        setUploads(res.items);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load uploads");
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
  }, [page, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  const openDetail = async (upload: UploadItem) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await fetchUploadDetail(upload.uploadid);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load upload detail");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <Header title="Operations" subtitle="Uploads and cloud connections" />

      {error ? <div className="alert">{error}</div> : null}

      <section className="panel">
        <div className="panel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Uploads</h3>
          <div className="filter-actions">
            <button
              className="ghost-btn icon-btn"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              title="Refresh uploads"
              aria-label="Refresh uploads"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M16.4 10a6.4 6.4 0 1 1-1.8-4.5l-1.7 1.7h4.6V2.6l-1.6 1.6A8 8 0 1 0 18 10h-1.6Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="muted" style={{ marginBottom: 12 }}>
          <span className="badge badge--success">Active</span>
        </div>

        {loading ? (
          <div className="muted">Loading uploads...</div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Upload ID</th>
                  <th>Client</th>
                  <th>Uploaded By</th>
                  <th>Uploaded At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No uploads found.
                    </td>
                  </tr>
                ) : (
                  uploads.map((upload) => (
                    <tr key={upload.uploadid} onClick={() => openDetail(upload)}>
                      <td className="cell-primary">{upload.uploadid}</td>
                      <td>{upload.client?.name || "—"}</td>
                      <td>{upload.uploadedBy?.full_name || "—"}</td>
                      <td>{formatDate(upload.uploadedat)}</td>
                      <td>
                        <span
                          className={`badge ${
                            upload.status === "COMPLETED"
                              ? "badge--success"
                              : upload.status === "FAILED"
                              ? "badge--failed"
                              : "badge--warning"
                          }`}
                        >
                          {upload.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

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
      </section>

      <section className="panel" style={{ opacity: 0.6 }}>
        <h3>AWS Connections</h3>
        <div className="muted" style={{ marginBottom: 12 }}>
          <span className="badge badge--warning">Standby</span>
        </div>
        <div className="muted">AWS Connections temporarily paused (backend not active).</div>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Upload {selected.uploadid}</div>
                <div className="muted">{selected.client?.name || "—"}</div>
              </div>
              <button className="ghost-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              {detailLoading ? <div className="muted">Loading detail...</div> : null}
              <div className="modal-row">
                <div className="modal-label">File name</div>
                <div className="modal-value">{selected.filename || "—"}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">File size</div>
                <div className="modal-value">{formatSize(selected.filesize)}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Row count</div>
                <div className="modal-value">N/A</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Uploaded at</div>
                <div className="modal-value">{formatDate(selected.uploadedat)}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Uploaded by</div>
                <div className="modal-value">{selected.uploadedBy?.full_name || "—"}</div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: "0 0 10px" }}>Status Timeline</h4>
                <div className="modal-row">
                  <div className="modal-label">Uploaded</div>
                  <div className="modal-value">{formatDate(selected.uploadedat)}</div>
                </div>
                <div className="modal-row">
                  <div className="modal-label">Processing Started</div>
                  <div className="modal-value">N/A</div>
                </div>
                {selected.status === "COMPLETED" ? (
                  <div className="modal-row">
                    <div className="modal-label">Completed</div>
                    <div className="modal-value">N/A</div>
                  </div>
                ) : null}
                {selected.status === "FAILED" ? (
                  <div className="modal-row">
                    <div className="modal-label">Failed</div>
                    <div className="modal-value">N/A</div>
                  </div>
                ) : null}
              </div>

              {selected.status === "FAILED" ? (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ margin: "0 0 10px" }}>Failure</h4>
                  <div className="modal-row">
                    <div className="modal-label">Error reason</div>
                    <div className="modal-value">N/A</div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-label">Error code</div>
                    <div className="modal-value">N/A</div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-actions">
              <div className="muted">
                Create a dev/debug ticket for failed uploads (not implemented yet).
              </div>
              <button className="ghost-btn ghost-btn--primary" disabled>
                Create Ticket (Under Progress)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsPage;
